import { runtimeConfig, type RuntimeConfig } from './config';
import { MockAssistantApi, RestAssistantApi, type AssistantApi } from './assistant-api';

export function createAssistantApi(
  config: RuntimeConfig = runtimeConfig,
): AssistantApi {
  if (config.apiMode === 'real') {
    return new RestAssistantApi(config.apiBaseUrl);
  }

  return new MockAssistantApi();
}
