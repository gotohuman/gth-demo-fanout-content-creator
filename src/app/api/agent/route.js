export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { AiFlow } from "gotohuman";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(request) {
  const req = await request.json()
  const model = new ChatOpenAI({ temperature: 0.75, model: "gpt-4o" });
  const aiFlow = new AiFlow({
    agentId: "content-writer", fetch: fetch.bind(globalThis)
  })
  aiFlow.step({id: "findNews", fn: async({config}) => {
    return await findNews(config.topic)
  }})
  aiFlow.gotoHuman({id: "selectNews", options: { multiSelectFanOut: true }})
  aiFlow.step({id: "researchNews", fn: async({input}) => {
    const newsDetails = await researchNews(model, input[0].text);
    return newsDetails;
  }})
  aiFlow.step({id: "draftSocialPost", fn: async({input}) => {
    console.log("draftSocialPost " + (typeof input), input)
    return await draftLinkedInPost(model, input);    
  }})
  aiFlow.gotoHuman({id: "approveDraft"})
  aiFlow.step({id: "publishPost", fn: async({input}) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }})
  const resp = await aiFlow.executeSteps(req);
  return Response.json(resp)
}

async function findNews(topic) {
  return ["OpenAI releases GPT-4o", "LangChain releases an Agent IDE", "Are multi-agent workflows the future?"]
}

async function researchNews(model, headline) {
  //TODO: replace with online search
  const messages = [
    new SystemMessage("You are a senior tech copy writer. You will be passed a topic. Please write a short hypothetical article about it."),
    new HumanMessage(headline),
  ];
  
  const completion = await model.invoke(messages);
  return completion.content;
}

async function draftLinkedInPost(model, content) {
  const messages = [
    new SystemMessage("You are a senior social media expert specialized in LinkedIn content for businesses. You will be passed information about a certain topic. Please create a short LinkedIn post without emojis."),
    new HumanMessage(content),
  ];
  
  const completion = await model.invoke(messages);
  return completion.content;
}