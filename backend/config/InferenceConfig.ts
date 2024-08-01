export interface IInferenceConfig {
  codeGeneratorModel: string;
  imageGeneratorModel: string;
  region: string;
}

export const INFERENCE_CONFIG: IInferenceConfig = {
  codeGeneratorModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
  imageGeneratorModel: 'stability.stable-diffusion-xl-v1',
  region: 'us-east-1'
};

//anthropic.claude-3-sonnet-20240229-v1:0
//anthropic.claude-instant-v1