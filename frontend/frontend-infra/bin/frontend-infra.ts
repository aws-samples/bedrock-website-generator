#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendInfraStack} from '../lib/frontend-infra-stack';

const app = new cdk.App();
new FrontendInfraStack(app, 'FrontendInfraStack', {
  env: { account: app.account, region: app.region }
});