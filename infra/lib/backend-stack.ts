import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwAuthorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as apigwIntegrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCTION_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://jsveteransolutions-web.vercel.app",
  "https://jsveteransolutions.com",
  "https://www.jsveteransolutions.com"
];

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1
    });

    const documentsKey = new kms.Key(this, "DocumentsKey", {
      enableKeyRotation: true,
      alias: "alias/jsvs-documents"
    });

    const documentsBucket = new s3.Bucket(this, "DocumentsBucket", {
      bucketName: undefined,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: documentsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const dbSecret = new secretsmanager.Secret(this, "DbSecret", {
      secretName: "jsvs/database",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "jsvsadmin" }),
        generateStringKey: "password",
        excludePunctuation: true
      }
    });

    const database = new rds.DatabaseInstance(this, "Postgres", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      multiAz: false,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      databaseName: "jsvs"
    });

    const postConfirmationFn = new lambda.Function(this, "PostConfirmationFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require("@aws-sdk/client-cognito-identity-provider");
const client = new CognitoIdentityProviderClient({});
exports.handler = async (event) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    await client.send(new AdminAddUserToGroupCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
      GroupName: "client"
    }));
  }
  return event;
};
`),
      timeout: cdk.Duration.seconds(10)
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "jsvs-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationFn);

    postConfirmationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminAddUserToGroup"],
        resources: [`arn:aws:cognito-idp:${this.region}:${this.account}:userpool/*`]
      })
    );

    const userPoolDomain = userPool.addDomain("AuthDomain", {
      cognitoDomain: { domainPrefix: `jsvs-auth-${this.account}` }
    });

    const userPoolClient = userPool.addClient("WebClient", {
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:3000/auth/callback",
          "http://localhost:3001/auth/callback",
          "https://jsveteransolutions.com/auth/callback",
          "https://www.jsveteransolutions.com/auth/callback",
          "https://jsveteransolutions-web.vercel.app/auth/callback"
        ],
        logoutUrls: [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://jsveteransolutions.com",
          "https://www.jsveteransolutions.com",
          "https://jsveteransolutions-web.vercel.app"
        ]
      }
    });

    for (const group of ["client", "assistant", "owner"]) {
      new cognito.CfnUserPoolGroup(this, `${group}Group`, {
        userPoolId: userPool.userPoolId,
        groupName: group
      });
    }

    const apiFunction = new lambda.Function(this, "ApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(join(dirname(fileURLToPath(import.meta.url)), "../../apps/api/dist")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        DATABASE_URL: `postgresql://jsvsadmin:${dbSecret.secretValueFromJson("password").unsafeUnwrap()}@${database.dbInstanceEndpointAddress}:5432/jsvs`,
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        DEV_AUTH_BYPASS: "false",
        RUN_MIGRATIONS: "true",
        CORS_ORIGIN: PRODUCTION_ORIGINS.join(",")
      },
      logRetention: logs.RetentionDays.ONE_MONTH
    });

    documentsBucket.grantReadWrite(apiFunction);
    documentsKey.grantEncryptDecrypt(apiFunction);
    dbSecret.grantRead(apiFunction);
    database.connections.allowDefaultPortFrom(apiFunction);

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "jsvs-api",
      corsPreflight: {
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: PRODUCTION_ORIGINS
      }
    });

    const authorizer = new apigwAuthorizers.HttpJwtAuthorizer(
      "CognitoAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId]
      }
    );

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: new apigwIntegrations.HttpLambdaIntegration("ApiIntegration", apiFunction),
      authorizer
    });

    httpApi.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwIntegrations.HttpLambdaIntegration("HealthIntegration", apiFunction)
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "CognitoDomain", { value: userPoolDomain.domainName });
    new cdk.CfnOutput(this, "DocumentsBucketName", { value: documentsBucket.bucketName });
    new cdk.CfnOutput(this, "DatabaseEndpoint", { value: database.dbInstanceEndpointAddress });
  }
}
