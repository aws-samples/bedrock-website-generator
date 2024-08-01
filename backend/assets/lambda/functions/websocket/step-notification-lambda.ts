import { TextEncoder } from 'util';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

const apiGwManApiClient = new ApiGatewayManagementApiClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.WS_API_ENDPOINT,
});

export const handler = async function (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  console.log(`event => ${JSON.stringify(event)}`);

  const { message }: { message: string } = event;

  const scanCommand = new ScanCommand({
    TableName: process.env.CONN_TABLE_NAME,
  });
  const scanCommandResp = await dynamoDBDocClient.send(scanCommand);
  console.log(`scanCommand resp => ${JSON.stringify(scanCommandResp)}`);

  const textEncoder = new TextEncoder();
  const connectionItems = scanCommandResp.Items || [];
  for (let ind = 0; ind < connectionItems.length; ind++) {
    const postToConnectionCommandResp = await apiGwManApiClient.send(new PostToConnectionCommand({
      ConnectionId: connectionItems[ind].connectionId,
      Data: textEncoder.encode(message),
    }));
    console.log(`postToConnectionCommand resp => ${JSON.stringify(postToConnectionCommandResp)}`);
  }
  return {
    statusCode: 200,
  };
};