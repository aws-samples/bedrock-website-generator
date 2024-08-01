import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface Props extends cdk.StackProps {
  readonly stateMachineArn: string;
}

export class ApiStack extends cdk.Stack {
  public readonly restApi: apigateway.IRestApi;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const stateMachine = sfn.StateMachine.fromStateMachineArn(this, 'stateMachine', props.stateMachineArn);

    const triggerLambda = new lambda.Function(this, 'TriggerLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset( 'assets/lambda/functions/trigger'),
      environment: {
        'STEP_FUNCTION_ARN': props.stateMachineArn
      }
    });

    stateMachine.grantStartExecution(triggerLambda);

    const restApi = new apigw.RestApi(this, 'RestApi', {});

    const executeEndpoint = restApi.root.addResource('execute', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'DELETE'],
      },
    });

    executeEndpoint.addMethod('POST', new apigateway.LambdaIntegration(triggerLambda, {
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      }],
      requestParameters: {
        'method.request.path.id': true,
      },

    });

    executeEndpoint.addMethod('DELETE', new apigateway.LambdaIntegration(triggerLambda, {
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
        },
      }],
      requestParameters: {
        'method.request.path.id': true,
      },
    });

    new ssm.StringParameter(this, 'BedrockApiIdParameter', {
      parameterName: '/bedrock/api/url',
      stringValue: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/execute`,
    });
  }
}
