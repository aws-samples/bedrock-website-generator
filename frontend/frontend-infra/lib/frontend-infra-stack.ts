import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { aws_iam, custom_resources} from 'aws-cdk-lib'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

export class FrontendInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const frontendAppRepo = new codecommit.Repository(this, 'MyRepository', {
      repositoryName: 'frontend-repo',
      code: codecommit.Code.fromDirectory(path.join(__dirname, '../../frontend-src'))
    });
    const myFrontendApp = new amplify.App(this, "MyFrontendApp ", {
        sourceCodeProvider: new amplify.CodeCommitSourceCodeProvider({
            repository: frontendAppRepo,
        }),
        platform: amplify.Platform.WEB_COMPUTE,
    });

    const distributionName = ssm.StringParameter.fromStringParameterAttributes(this, 'DistributionName', {
      parameterName:'/cloudfront/distribution/name',
    }).stringValue;

    const wssApiUrl = ssm.StringParameter.fromStringParameterAttributes(this, 'wssApiUrl', {
      parameterName:'/wss/api/url',
    }).stringValue;

    const bedrockApiUrl = ssm.StringParameter.fromStringParameterAttributes(this, 'bedrockApiUrl', {
      parameterName:'/bedrock/api/url',
    }).stringValue;

    const secret = ssm.StringParameter.fromStringParameterAttributes(this, 'iamSecret', {
      parameterName:'/iam/user/secret',
    }).stringValue;

    const accessKey = ssm.StringParameter.fromStringParameterAttributes(this, 'accessLey', {
      parameterName:'/iam/user/accesskey',
    }).stringValue;


    const environmentVariables: [string, string][] = [
      ['NEXT_PUBLIC_DISTRIBUTION_NAME', distributionName],
      ['NEXT_PUBLIC_AWS_REGION', this.region],
      ['NEXT_PUBLIC_SAMPLE_RATE', '44100'],
      ['NEXT_PUBLIC_LANGUAGE', "en-US"],
      ['NEXT_PUBLIC_WSS_API_URL', wssApiUrl],
      ['NEXT_PUBLIC_BEDROCK_API_URL', bedrockApiUrl],
      ['NEXT_PUBLIC_AWS_ACCESS_KEY_ID', accessKey],
      ['NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY', secret]
    ];
    for (const [key, value] of environmentVariables) {
      myFrontendApp.addEnvironment(key, value);
    }
    
    const masterBranch = myFrontendApp.addBranch("main");
    
    const triggerPolicy = new  aws_iam.PolicyStatement({
        actions: [
          'amplify:StartJob',
      ],
        resources: [`${masterBranch.arn}/jobs/*`]
    })
    
    new custom_resources.AwsCustomResource(this, 'triggerAppBuild', {
        policy: custom_resources.AwsCustomResourcePolicy.fromStatements([triggerPolicy]),
        onCreate: {
            service: 'Amplify',
            action: 'startJob',
            physicalResourceId: custom_resources.PhysicalResourceId.of('app-build-trigger'),
            parameters: {
                appId: myFrontendApp.appId,
                branchName: masterBranch.branchName,
                jobType: 'RELEASE',
                jobReason: 'Auto Start build',
            }
        }, 
    }) 
  }
}
