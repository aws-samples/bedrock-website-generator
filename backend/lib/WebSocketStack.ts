import * as apigw2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigw2Integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class WebSocketStack extends cdk.Stack {
  public readonly stepNotificationLambdaName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionTable = new dynamodb.Table(this, 'ConnectionTable', {
      partitionKey: {
        name: 'connectionId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const wsConnectLambda = new lambdaNodejs.NodejsFunction(this, 'WsConnectLambda', {
      entry: 'assets/lambda/functions/websocket/ws-connect-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        CONN_TABLE_NAME: connectionTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
    });
    connectionTable.grantWriteData(wsConnectLambda);

    const wsDisconnectLambda = new lambdaNodejs.NodejsFunction(this, 'WsDisconnectLambda', {
      entry: 'assets/lambda/functions/websocket/ws-disconnect-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        CONN_TABLE_NAME: connectionTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
    });
    connectionTable.grantWriteData(wsDisconnectLambda);

    const webSocketApi = new apigw2.WebSocketApi(this, 'WebSocketApi', {
      connectRouteOptions: {
        integration: new apigw2Integrations.WebSocketLambdaIntegration('ws-connect-integration', wsConnectLambda),
      },
      disconnectRouteOptions: {
        integration: new apigw2Integrations.WebSocketLambdaIntegration('ws-disconnect-integration', wsDisconnectLambda),
      },
    });

    const webSocketStage = new apigw2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    const stepNotificationLambda = new lambdaNodejs.NodejsFunction(this, 'StepNotificationLambda', {
      entry: 'assets/lambda/functions/websocket/step-notification-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        WS_API_ENDPOINT: `https://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketStage.stageName}`,
        CONN_TABLE_NAME: connectionTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
    });
    this.stepNotificationLambdaName = stepNotificationLambda.functionName;

    connectionTable.grantReadData(stepNotificationLambda);
    webSocketApi.grantManageConnections(stepNotificationLambda);

    new ssm.StringParameter(this, 'WebSocketApiParameter', {
      parameterName: '/wss/api/url',
      stringValue: `wss://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/prod`,
    });
  }
}