import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class WebsiteDistributionStack extends cdk.Stack {
  public readonly websiteBucketName: string;
  public readonly distributionName: string;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.websiteBucketName = websiteBucket.bucketName;
    
    new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [s3deploy.Source.asset('assets/repository/')],
      destinationBucket: websiteBucket,
    });



    const cloudfront = new cdk.aws_cloudfront.Distribution(this, 'VoiceCodeDistribution', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
        compress: true,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
      },
      defaultRootObject: 'index0.html'
    });

    const frontEndUser = new iam.User(this, 'User');
    // Attach the AmazonTranscribeFullAccess managed policy to the user
    frontEndUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTranscribeFullAccess'));
    frontEndUser.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'));

    const accessKey = new iam.AccessKey(this, 'FrontEnd', { user: frontEndUser });
    accessKey.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    new ssm.StringParameter(this, 'accesskey', {
      parameterName: '/iam/user/accesskey',
      stringValue: accessKey.accessKeyId,
    });

    new ssm.StringParameter(this, 'secret', {
      parameterName: '/iam/user/secret',
      stringValue: accessKey.secretAccessKey.toString(),
    });

    new ssm.StringParameter(this, 'DistributionName', {
      parameterName: '/cloudfront/distribution/name',
      stringValue: cloudfront.distributionDomainName,
    });
    this.distributionName = cloudfront.distributionDomainName

  }
}