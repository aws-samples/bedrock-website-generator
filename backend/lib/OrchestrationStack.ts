import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { INFERENCE_CONFIG } from '../config/InferenceConfig';


interface Props extends cdk.StackProps {
  bucketName: string;
  distributionName: string;
  stepNotificationLambdaName: string;
}

export class OrchestrationStack extends cdk.Stack {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, 'Bucket', props.bucketName);
    const notificationLambda = lambda.Function.fromFunctionName(this, 'NotificationLambda', props.stepNotificationLambdaName);

    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/*`,
        `arn:aws:bedrock:${INFERENCE_CONFIG.region}::foundation-model/*`,
      ],
    });

    const layerBs4 = new lambda.LayerVersion(this, 'layerBs4', {
      code: lambda.Code.fromAsset( 'assets/lambda/layer/bs4', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install --no-cache -r requirements.txt -t /asset-output/python && cp -au . /asset-output/python',
          ],
        },
      }),
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    });

    const resetBucket = new lambda.Function(this, 'ResetBucket', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('assets/lambda/functions/resetBucket'),
      handler: 'index.lambda_handler',
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: props.bucketName,
      },
    });

    bucket.grantReadWrite(resetBucket);

    const getFiles = new lambda.DockerImageFunction(this, 'GetFiles', {
      code: lambda.DockerImageCode.fromImageAsset('assets/lambda/functions/getFiles'),
      environment: {
        BUCKET_NAME: props.bucketName,
        DISTRIBUTION_NAME: props.distributionName
      },
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      architecture: lambda.Architecture.X86_64,
    });

    bucket.grantReadWrite(getFiles);

    const generateCode = new lambda.Function(this, 'GenerateCode', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('assets/lambda/functions/claude3'),
      handler: 'index.lambda_handler',
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        CODE_GENERATOR_MODEL: INFERENCE_CONFIG.codeGeneratorModel,
        REGION: INFERENCE_CONFIG.region,
        BUCKET_NAME: props.bucketName
      },
      layers: [layerBs4],
    });
    bucket.grantRead(generateCode);

    generateCode.addToRolePolicy(bedrockPolicy);

    const generateImage = new lambda.Function(this, 'GenerateImage', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('assets/lambda/functions/generateImage'),
      handler: 'index.lambda_handler',
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: props.bucketName,
        IMAGE_GENERATOR_MODEL: INFERENCE_CONFIG.imageGeneratorModel,
      },
    });
    generateImage.addToRolePolicy(bedrockPolicy);
    bucket.grantReadWrite(generateImage);

    const uploadFiles = new lambda.Function(this, 'UploadFiles', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('assets/lambda/functions/uploadFiles'),
      handler: 'index.lambda_handler',
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: props.bucketName,
      },
    });
    bucket.grantWrite(uploadFiles);

    const choice1 = new sfn.Choice(this, 'Choice1');
    const choice2 = new sfn.Choice(this, 'Choice2');
    const condition1 = sfn.Condition.stringEquals('$.httpMethod', 'POST');
    const condition2 = sfn.Condition.stringEquals('$.Payload.body.image', 'True');

    const uploadFilesTask = new tasks.LambdaInvoke(this, 'UploadFilesTask', {
      lambdaFunction: uploadFiles,
    });

    const choiceCondition2 = choice2.when(
      condition2,

      new tasks.LambdaInvoke(this, 'SendMessageImageTask', {
        lambdaFunction: notificationLambda,
        payload: sfn.TaskInput.fromObject({
          'message': "Generating images...",
        }),
        resultPath: sfn.JsonPath.DISCARD
      })
      .next(
        new tasks.LambdaInvoke(this, 'GenerateImageTask', {
          lambdaFunction: generateImage,
          resultPath: sfn.JsonPath.DISCARD
        })
      )
      .next(new tasks.LambdaInvoke(this, 'SendMessageImageTaskDone', {
        lambdaFunction: notificationLambda,
        payload: sfn.TaskInput.fromObject({
          'message': "Images Generated",
        }),
        resultPath: sfn.JsonPath.DISCARD
      }))

        .next(
          uploadFilesTask,
        ),
    )
      .otherwise(
        new tasks.LambdaInvoke(this, 'SendMessageNoImageTask', {
          lambdaFunction: notificationLambda,
          payload: sfn.TaskInput.fromObject({
            'message': "No new image generated...",
          }),
          resultPath: sfn.JsonPath.DISCARD
        })
        .next(new tasks.LambdaInvoke(this, 'SendMessageUploadTask', {
          lambdaFunction: notificationLambda,
          payload: sfn.TaskInput.fromObject({
            'message': "Uploading the files",
          }),
          resultPath: sfn.JsonPath.DISCARD
        }))
        .next(uploadFilesTask),
      );

    const choiceCondition1 = choice1.when(
      condition1,
      new tasks.LambdaInvoke(this, 'GetFilesTask', {
        lambdaFunction: getFiles,
      })
        .next(
          new tasks.LambdaInvoke(this, 'SendMessageCodeTask', {
            lambdaFunction: notificationLambda,
            payload: sfn.TaskInput.fromObject({
              'message': "Generating HTML and CSS code...",
            }),
            resultPath: sfn.JsonPath.DISCARD
          })
        )
        .next(
          new tasks.LambdaInvoke(this, 'GenerateCodeTask', {
            lambdaFunction: generateCode,
          }).addRetry({
            errors: ['States.TaskFailed'],
            interval: cdk.Duration.seconds(0),
            maxAttempts: 3,
          })
        )
        .next(choiceCondition2),
    )
      .otherwise(
        new tasks.LambdaInvoke(this, 'ResetBucketTask', {
          lambdaFunction: resetBucket,
        }),
      );

    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: choiceCondition1,
    });

    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}
