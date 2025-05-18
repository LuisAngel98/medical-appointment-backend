// const AWS = require('aws-sdk');

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//   region: 'localhost',
//   endpoint: 'http://localhost:8000'
// });

// exports.hello = async (event) => {
//   const params = {
//     TableName: 'HelloWorldTable',
//     Item: {
//       id: '1',
//       message: 'Hola Mundo desde DynamoDB'
//     }
//   };
//   try {
//     await dynamoDb.put(params).promise();
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ message: 'Guardado en DynamoDB Local' })
//     };
//   } catch (error) {
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'Error al guardar en DynamoDB Local',msg: error.message })
//     };
//   }
// };
