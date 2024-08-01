import boto3
from io import BytesIO
import os
import json
from selenium import webdriver
from tempfile import mkdtemp
from selenium.webdriver.common.by import By
import base64

s3_client = boto3.client("s3")

html_filename = 'index0.html'
css_filename = 'styles.css'
java_filename = 'script.js'

def get_html_css_code(bucket, html_filename, css_filename, java_filename):
    f_html, f_css, f_java = BytesIO(), BytesIO(), BytesIO()

    #Downloading html file
    s3_client.download_fileobj(bucket, html_filename, f_html)
    b_html = f_html.getvalue()
    html_code = b_html.decode('utf-8').replace('"', "'")

    #Downloading css file 
    s3_client.download_fileobj(bucket, css_filename, f_css)
    b_css = f_css.getvalue()
    css_code = b_css.decode('utf-8').replace('"', "'")
    
    #Downloading Javascript file 
    s3_client.download_fileobj(bucket, java_filename, f_java)
    b_java = f_java.getvalue()
    java_code = b_java.decode('utf-8').replace('"', "'")
    
    
    return html_code, css_code, java_code
def screen_shot():
    path = "/tmp/screenshot.png"
    options = webdriver.ChromeOptions()
    service = webdriver.ChromeService("/opt/chromedriver")

    options.binary_location = '/opt/chrome/chrome'
    options.add_argument("--headless=new")
    options.add_argument('--no-sandbox')
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280x1696")
    options.add_argument("--single-process")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-dev-tools")
    options.add_argument("--no-zygote")
    options.add_argument(f"--user-data-dir={mkdtemp()}")
    options.add_argument(f"--data-path={mkdtemp()}")
    options.add_argument(f"--disk-cache-dir={mkdtemp()}")
    options.add_argument("--remote-debugging-port=9222")
    
    driver = webdriver.Chrome(options=options, service=service)
    
    driver.get(f"https://{os.environ['DISTRIBUTION_NAME']}")
    driver.save_screenshot(path)
    with open(path, 'rb') as file:
        s3_client.put_object(Bucket=os.environ['BUCKET_NAME'], Key='websiteimage.png', Body=file)
    driver.quit()
    
    return path

def lambda_handler(event, context):
    html_code, css_code, java_code = get_html_css_code(os.environ['BUCKET_NAME'], html_filename, css_filename, java_filename )
    customer_request_body = event['body']
    customer_request = json.loads(customer_request_body)
    screen_shot()

    return {
        'statusCode': 200,
        'body': {
            'html': html_code,
            'css' : css_code,
            'java': java_code,
            'image': 'websiteimage.png',
            'transcription' : customer_request['transcription']
        }
    }


