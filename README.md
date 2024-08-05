# Voice to Code

Code frontend website with your voice!

## Introduction

Is coding for me? Whether you're a developer or just curious about learning to code, you may have already asked yourself this question.

With Voice To Code, harnessing the power of AWS services, including Amazon Bedrock and underlying third-party models, becomes your gateway to effortlessly coding frontend applications using nothing but your voice. 
Picture a scenario where you simply articulate commands like adding a search bar, generating an image, or creating a whole e-commerce website, and watch your ideas come to life.

## Deployment

Follow this steps to deploy this project in you AWS Account

First install the deployment pipeline:

* `cd deployment-pipeline`
* `cdk deploy`

Once the deployment is done, you have an empty CodeCommit and a CodePipeline that source from it.
This pipeline deploys the backend and the frontend of Voice To Code

To deploy the backend and the frontend:
* `cd ..` move at the root of the project
* `git remote add origin https://git-codecommit.*/repos/voice-to-code` add the newly created CodeCommit
* `git add .` 
* `git commit -m "initial commit"` 
* `git push` 

## How to use Voice to Code

* If you have a specific idea you can use **your voice**, click the **red button (next to the bar) to start reccording** and click again to stop reccording
* After you have reviewed the transcript of your voice in the bar you can generate the website, click the **green "Validate" button**
* You can customize and add new features to your generated website by doing again the previous steps
*  _Be sure to clear the cache if you can't see the result (generated website)_
  _Example: If you are on MacOs and using Chrome as a browser you can clear the cache with the commands: CMD + SHIFT + R_
* If you want to **create a new website**, click the **red "Reset" button**

## Architecture Diagram

Here is an architectural diagram representing the different AWS services used.

![Here is an architectural diagram representing the different AWS services used.](/architecture-diagram.png)


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

