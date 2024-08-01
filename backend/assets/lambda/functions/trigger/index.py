import boto3
import os
import json
client = boto3.client("stepfunctions")


def lambda_handler(event, context):
    print(event)
    client.start_execution(
        stateMachineArn=os.environ["STEP_FUNCTION_ARN"],
        input = json.dumps(event)
    )
    return {
        "statusCode": 200,
    }
