// base-agent.ts

/**
 * Abstract class representing a base agent.
 */
export abstract class BaseAgent {
    abstract performTask(task: AgentTask): Promise<void>;
}

/**
 * Interface representing a task that an agent can perform.
 */
export interface AgentTask {
    taskName: string;
    parameters: Record<string, any>;
}

/**
 * AI integration for handling tasks.
 */
export class AIIntegration {
    static processTask(agent: BaseAgent, task: AgentTask): Promise<void> {
        return agent.performTask(task);
    }
}