/**
* Copyright 2022 Amazon.com Inc. or its affiliates.
* Provided as part of Amendment No. 5 to Definitive Agreement No. 8,
* Activity/Deliverable 10 (to the Strategic Framework Agreement dated March 26, 2019).
*/

import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');

export class DeployBackendConstruct extends Construct {
  public readonly project: codebuild.PipelineProject;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      });

    new iam.Policy(this, 'IAMPolicy', {
      statements: [
        new iam.PolicyStatement({
          sid: 'deployPolicies',
          actions: [
            'cloudformation:CreateStack',
            'cloudformation:UpdateStack',
            'cloudformation:DescribeStacks',
            'cloudformation:DescribeStackEvents',
            'cloudformation:DescribeChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:DeleteStack',
          ],
          effect: iam.Effect.ALLOW,
          resources: [`arn:aws:cloudformation:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:stack/CDKToolkit/*`],
        }),
        new iam.PolicyStatement({
          sid: 'assumeRole',
          actions: [
            'sts:AssumeRole',
          ],
          effect: iam.Effect.ALLOW,
          resources: [ 
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:role/cdk-*-deploy-role-${process.env.CDK_DEFAULT_ACCOUNT}-${process.env.CDK_DEFAULT_REGION}`,
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:role/cdk-*-file-publishing-role-${process.env.CDK_DEFAULT_ACCOUNT}-${process.env.CDK_DEFAULT_REGION}`,
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:role/cdk-*-lookup-role-${process.env.CDK_DEFAULT_ACCOUNT}-${process.env.CDK_DEFAULT_REGION}`,
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:role/cdk-*-container-assets-${process.env.CDK_DEFAULT_ACCOUNT}-${process.env.CDK_DEFAULT_REGION}`,
            `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT}:role/cdk-*-image-publishing-role-${process.env.CDK_DEFAULT_ACCOUNT}-${process.env.CDK_DEFAULT_REGION}`
          ],
        }),
      ],
    }).attachToRole(codeBuildRole);
  
    this.project = new codebuild.PipelineProject(this, 'CodeBuildProject', {
      description: 'Deploys the Stack',
      role: codeBuildRole,
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.CUSTOM),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            runtimeVersions: {
              python: '3.11',
            },
            commands: [
              'cd backend',
              'npm i',
            ],
          },
          build: {
            commands: [
              'ls -l',
              'npm run cdk deploy "*"',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
        cache: {
          paths: ['node_modules/**/*']
        }
      },
      ),
    });
  }
}