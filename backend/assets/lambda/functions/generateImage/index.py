import boto3
import json
import os
from io import BytesIO
import base64
from multiprocessing import Process

session = boto3.Session() 
bedrock_runtime = session.client(service_name= "bedrock-runtime")
s3_client = session.client('s3')

# Functions
bucket = os.environ['BUCKET_NAME']
html_filename = 'src/htmlcode/index0.html'
css_filename = 'src/csscode/styles.css'

def generate(path, desc, bucket):
        print(f"Generating and image with the following description: {desc}")  
        kwargs = {
            "modelId": os.environ['IMAGE_GENERATOR_MODEL'],
            "contentType": "application/json",
            "accept": "application/json",
            "body": "{\"text_prompts\":[{\"text\":\""+desc+"\"}],\"cfg_scale\":10,\"seed\":0,\"steps\":50}"
            }
        response = bedrock_runtime.invoke_model(**kwargs)
        base_64_img_str = json.loads(response.get("body").read())["artifacts"][0].get("base64")
        os.makedirs("/tmp/images", exist_ok=True)
        image_1 = BytesIO(base64.decodebytes(bytes(base_64_img_str, "utf-8")))
        s3_client.upload_fileobj(image_1, bucket, path, ExtraArgs={'ContentType': "image/png"})

    
def generate_images(image_data, bucket):
    process_list = []
    for image in  image_data: 
        path = image['src']
        desc = image['alt']
        try:
            s3_client.head_object(Bucket=bucket, Key=path)
        except:
            p = Process(target=generate(path, desc, bucket))
            p.start()
            process_list.append(p)
    if len(process_list)>0:
        for process in process_list:
            process.join()



def lambda_handler(event, context):
    payload_body = event['Payload']['body']
    image_data = payload_body['image_data']
    
    generate_images(image_data, bucket)
    
    return {
        'statusCode': 200,
    }


