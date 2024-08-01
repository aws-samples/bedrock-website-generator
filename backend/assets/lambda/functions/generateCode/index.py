import boto3
import json
import os
from botocore.config import Config
import re
from bs4 import BeautifulSoup

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
    if html_json_data and css_json_data:
        html_extracted_json = html_json_data.group(1)
        css_extracted_json = css_json_data.group(1)
    else:
        print("No JSON data found.")

    return html_extracted_json, css_extracted_json

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

def create_prompt(html_code, css_code, customer_request):
    prompt= f"""
    Here are the HTML and CSS related code you will use to understand the current design of the website to complete the task:
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
            CSS code
            </source>
            <document_content>
            {css_code}
            </document_content>
        </document>
    </documents>
    Based on this HTML and CSS code I provided you, write and edit a high-quality HTML and CSS code to build a website for the given task.
    Something a very skilled HTML and CSS expert would write. Make the website professional and pretty.
    Make sure to add to the HTML code this link <link rel='stylesheet' href='styles.css'>
    For every <img > that you give, give a source 'src' and 'alt'
    Every image should have a source starting with 'images/' and an 'alt' being the description of the image
    Do not change the html code that is not concerned by the request in the <request></request> XML tags.
    In your response: Write the HTML code in <htmlcode></htmlcode> XML tag and write the CSS code in <csscode></csscode> XML tag.
    Here is the task:
    {customer_request}
    """.encode('unicode_escape').decode('utf-8')
    
    return prompt

def invoke_model(html_code, css_code, customer_request):
    prompt = create_prompt(html_code, css_code, customer_request)
    
    kwargs = {
        "modelId": os.environ['CODE_GENERATOR_MODEL'],
        "contentType": "application/json",
        "accept": "*/*",
        "body": "{\"prompt\":\"Human: "+ prompt + "\\nAssistant:\",\"max_tokens_to_sample\":4000,\"temperature\":1,\"top_k\":10,\"top_p\":0.999,\"stop_sequences\":[\"\\n\\nHuman:\"],\"anthropic_version\":\"bedrock-2023-05-31\"}"
    }
    response = bedrock_runtime.invoke_model(**kwargs)
    
    body = json.loads(response.get('body').read())
    return body['completion']

def lambda_handler(event, context):
    payload_body = event['Payload']['body']
    html_code = payload_body['html']
    css_code = payload_body['css']
    customer_request = payload_body['transcription']
    
    response = invoke_model(html_code, css_code, customer_request)
    
    html_extracted_json, css_extracted_json = parse_result(response)
    image_data = get_images(html_extracted_json)

    if image_data == []:
        return {
            'statusCode': 200,
            'body': {
                'html': html_extracted_json,
                'css': css_extracted_json,
                'image': 'False'
            }
        }   
        
    else:
        return {
            'statusCode': 200,
            'body': {
                'html': html_extracted_json,
                'css': css_extracted_json,
                'image': 'True',
                'image_data': image_data
            }
        } 


