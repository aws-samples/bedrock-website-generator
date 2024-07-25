import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { DeployBackendConstruct } from './constructs/DeployBackendConstruct';
import { DeployFrontendConstruct } from './constructs/DeployFrontendConstruct';
import * as path from "path";

export class DeploymentPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'voice-to-code',
    });

    new ssm.StringParameter(this, 'RepositoryName', {
      parameterName:'/codecommit/repository/name' ,
      stringValue: repository.repositoryName,
    });

    const ArtifactBucket = new s3.Bucket(this, 'ArtifactBucket', {});
    const sourceArtifact = new codepipeline.Artifact();

    const deployPipeline = new codepipeline.Pipeline(this, 'DeployPipeline', {
      pipelineName: 'Deploy-Pipeline',
      stages: [{
        stageName: 'Source',
        actions: [
          new codepipelineActions.CodeCommitSourceAction({
            actionName: 'SourceBackend',
            repository: repository,
            branch: 'main',
            output: sourceArtifact,
          })
        ],
      },
      ],
      artifactBucket: ArtifactBucket,
    });

    deployPipeline.addStage({
      stageName: 'DeployBackend',
      actions: [
        new codepipelineActions.CodeBuildAction({
          actionName: 'DeployBackend',
          project: new DeployBackendConstruct( this, 'DeployBackendConstruct').project,
          input: sourceArtifact,
        }),
      ],
    });

    deployPipeline.addStage({
      stageName: 'DeployFrontend',
      actions: [
        new codepipelineActions.CodeBuildAction({
          actionName: 'DeployFrontend',
          project: new DeployFrontendConstruct( this, 'DeployFrontendConstruct').project,
          input: sourceArtifact,
        }),
      ],
    });
  }
}
