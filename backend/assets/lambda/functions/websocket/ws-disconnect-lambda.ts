import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2,
} from 'aws-lambda';
import 'source-map-support/register';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler: APIGatewayProxyWebsocketHandlerV2 =
async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event:', JSON.stringify(event));

  const deleteCommand = new DeleteCommand({
    TableName: process.env.CONN_TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId,
    },
  });
  const resp = await dynamoDBDocClient.send(deleteCommand);
  console.log(`deleteCommand resp => ${JSON.stringify(resp)}`);

  return { statusCode: 200 };
};