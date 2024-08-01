import boto3
import json
import os

s3_client = boto3.client("s3")
bucket = os.environ['BUCKET_NAME']

def reset(bucket):
    # Reset hmtl and css 
    print("Get Object 'reset/index0.html' ")
    html = s3_client.get_object(Bucket=bucket, Key='reset/index0.html')
    print("Get Object 'reset/styles.css' ")
    css = s3_client.get_object(Bucket=bucket, Key='reset/styles.css')
    print("Get Object 'reset/script.js' ")
    java = s3_client.get_object(Bucket=bucket, Key='reset/script.js')
    
    print(" ---------- ")
    print(f"Put to S3 Bucket: {bucket}")
    s3_client.put_object(Bucket=bucket, Key='index0.html', Body=html['Body'].read(), ContentType="text/html")
    s3_client.put_object(Bucket=bucket, Key='styles.css', Body=css['Body'].read(), ContentType="text/css")
    s3_client.put_object(Bucket=bucket, Key='script.js', Body=java['Body'].read(), ContentType="application/x-javascript")

    print("End of get and Put operations")
    
    # Delete s3 images/ folder
    objects = s3_client.list_objects_v2(Bucket=bucket, Prefix='images/')
    for obj in objects.get('Contents', []):
        s3_client.delete_object(Bucket=bucket, Key=obj['Key'])
        print(f"Deleted: {obj['Key']}")

def lambda_handler(event, context):
    reset(bucket)
    print("Call successfully Reset Function")
    return {
        'statusCode': 200,
        'body': json.dumps('Reset: Done!')
    }
