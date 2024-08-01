import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/ApiStack';
import { OrchestrationStack } from '../lib/OrchestrationStack';
import { WebsiteDistributionStack } from '../lib/WebsiteDistributionStack';
import { WebSocketStack } from '../lib/WebSocketStack';

const app = new cdk.App();

const webSocketStack = new WebSocketStack(app, 'VoiceToCode-WebSocketStack');

const websiteDistributionStack = new WebsiteDistributionStack(app, 'VoiceToCode-WebsiteDistributionStack');

const orchestrationStack = new OrchestrationStack(app, 'VoiceToCode-OrchestrationStack', {
  bucketName: websiteDistributionStack.websiteBucketName,
  distributionName: websiteDistributionStack.distributionName,
  stepNotificationLambdaName: webSocketStack.stepNotificationLambdaName,
});

new ApiStack(app, 'VoiceToCode-ApiStack', {
  stateMachineArn: orchestrationStack.stateMachineArn,
});