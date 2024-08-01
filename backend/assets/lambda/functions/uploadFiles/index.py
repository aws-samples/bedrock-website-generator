import boto3
import os

s3_client = boto3.client('s3')

def update_webpage(bucket, html_filename_to_upload, css_filename_to_upload, java_filename_to_upload):
    s3_client.put_object(Bucket=bucket, Key='index0.html', Body=html_filename_to_upload, ContentType="text/html")
    s3_client.put_object(Bucket=bucket, Key='styles.css', Body=css_filename_to_upload, ContentType="text/css")
    s3_client.put_object(Bucket=bucket, Key='script.js', Body=java_filename_to_upload, ContentType="application/x-javascript")

def lambda_handler(event, context):
    payload_body = event['Payload']['body']
    html = payload_body['html']
    css = payload_body['css']
    java = payload_body['java']
    
    update_webpage(os.environ['BUCKET_NAME'], html, css, java)
    
    return {
        'statusCode': 200,
    }