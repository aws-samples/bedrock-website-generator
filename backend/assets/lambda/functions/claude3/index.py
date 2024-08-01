import boto3
import json
import os
from botocore.config import Config
import re
from bs4 import BeautifulSoup
import base64

my_config = Config(
    region_name = os.environ['REGION'],
)

bedrock_runtime = boto3.client('bedrock-runtime', config= my_config)
s3_client = boto3.client("s3")

html_filename = 'src/htmlcode/index0.html'
css_filename = 'src/csscode/styles.css'

def parse_result(text):
    html_json_data = re.search(r'<htmlcode>(.*?)</htmlcode>', text, re.DOTALL)
    css_json_data = re.search(r'<csscode>(.*?)</csscode>', text, re.DOTALL)
    java_json_data = re.search(r'<javacode>(.*?)</javacode>', text, re.DOTALL)
    if html_json_data and css_json_data and java_json_data :
        html_extracted_json = html_json_data.group(1)
        css_extracted_json = css_json_data.group(1)
        java_extracted_json = java_json_data.group(1)
    else:
        print("No JSON data found.")

    return html_extracted_json, css_extracted_json, java_extracted_json

def get_images(html_code):
    soup = BeautifulSoup(html_code, 'html.parser')

    # Find all <img> tags
    img_tags = soup.find_all('img')

    # Extract src and alt attributes from each <img> tag
    image_data = []
    for img in img_tags:
        src = img.get('src')
        alt = img.get('alt')
        image_data.append({'src': src, 'alt': alt})
    return image_data

def create_prompt(html_code, css_code, java_code, customer_request):
    prompt= f"""
    I am building a website. I want you to help me design the website. I gave you a screenshot of the website so you understand better what I have done.
    Here are the HTML Javascript and CSS related code you will use to understand the current design of the website to complete the task:
    <documents>
        <documents index='1'>
            <source>
            HTML code
            </source>
            <document_content>
            {html_code}
            </document_content>
        <documents index='2'>
            <source>
            Javascript code
            </source>
            <document_content>
            {java_code}
            </document_content>
        <documents index='3'>
            <source>
            CSS code
            </source>
            <document_content>
            {css_code}
            </document_content>
        </document>
    </documents>
    Based on this HTML, Javascript and CSS code I provided you, write and edit a high-quality HTML, Javascript and CSS code to build a website for the given task:
    {customer_request}
    Make sure to add to the HTML code this link <link rel='stylesheet' href='styles.css'>
    Make sure to add to the HTML code this script <script src="script.js"></script>
    
    For every <img > that you give, give a source 'src' and 'alt'
    Every image should have a source starting with 'images/' and an 'alt' being the description of the image
    In your response: Write respectively the the HTML,  Javascript and CSS code in <htmlcode></htmlcode> <javacode></javacode> <csscode></csscode>  XML tags.
    """.encode('unicode_escape').decode('utf-8')
    
    return prompt

def invoke_model(html_code, css_code, java_code, website_image_64, customer_request):
    prompt = create_prompt(html_code, css_code, java_code, customer_request)
    
    prompt = {"role": "user",
             "content": [
                {"type": "image", "source": {"type": "base64",
                    "media_type": "image/jpeg", "data": website_image_64}},
                {"type": "text", "text": f"{prompt}"}
                ]}
    
    
    print(prompt)
    body=json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [prompt],
            "temperature":0.2,
            "system": "Skip the preamble and provide only the code",
        }  
    )  
    response = bedrock_runtime.invoke_model(body=body, modelId=os.environ['CODE_GENERATOR_MODEL'])
    response_body = json.loads(response.get('body').read())
    print(response_body)
    return response_body['content'][0]['text']

def lambda_handler(event, context):
    payload_body = event['Payload']['body']
    html_code = payload_body['html']
    css_code = payload_body['css']
    java_code = payload_body['java']
    image_key = payload_body['image']
    customer_request = payload_body['transcription']
    
    website_image = s3_client.get_object(Bucket=os.environ['BUCKET_NAME'], Key=image_key)['Body'].read()
    website_image_64 = base64.b64encode(website_image).decode('utf-8')
    
    response = invoke_model(html_code, css_code, java_code, website_image_64, customer_request)
    
    html_extracted_json, css_extracted_json, java_extracted_json = parse_result(response)
    image_data = get_images(html_extracted_json)

    if image_data == []:
        return {
            'statusCode': 200,
            'body': {
                'html': html_extracted_json,
                'css': css_extracted_json,
                'java': java_extracted_json,
                'image': 'False'
            }
        }   
        
    else:
        return {
            'statusCode': 200,
            'body': {
                'html': html_extracted_json,
                'css': css_extracted_json,
                'java': java_extracted_json,
                'image': 'True',
                'image_data': image_data
            }
        } 


