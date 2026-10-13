// ==============================================================================
// Zuu Agent — Standalone 24/7 Server-Side Cron Scheduler Engine
// Runs inside the Node dev server process, automatically evaluating cron
// patterns and triggering workflow runs in the background.
// ==============================================================================

import handleWorkflowRun from '../api/workflows/run';

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string; // e.g. "0 14 * * *" or "*/10 * * * *"
  lastRunMinute?: string;
  isActive: boolean;
  topic: string;
}

// Default active registered scheduled tasks
const registeredTasks: ScheduledTask[] = [
  {
    id: 'task_trollogiya_daily',
    name: 'Trollogiya Daily Bengali Satire Flow',
    cronExpression: '0 14 * * *', // Everyday at 2:00 PM
    isActive: true,
    topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান'
  },
  {
    id: 'task_tech_digest_morning',
    name: 'Morning Tech News Digest',
    cronExpression: '0 9 * * *', // Everyday at 9:00 AM
    isActive: true,
    topic: 'Autonomous Multi-Agent AI Breakthroughs'
  }
];

export class BackgroundCronScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static lastCheckedMinute: string = '';

  /**
   * Starts the 24/7 background cron scheduler loop
   */
  static start() {
    if (this.timer) return;

    console.log('[Zuu Cron Scheduler] 24/7 Background Scheduler initialized.');

    // Check every 20 seconds
    this.timer = setInterval(() => {
      this.evaluateSchedules();
    }, 20000);

    // Initial check
    this.evaluateSchedules();
  }

  /**
   * Stops the background scheduler
   */
  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Matches current system time against cron expressions
   */
  private static evaluateSchedules() {
    const now = new Date();
    const currentMinuteStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    // Prevent running multiple times in the same minute
    if (this.lastCheckedMinute === currentMinuteStr) {
      return;
    }
    this.lastCheckedMinute = currentMinuteStr;

    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    for (const task of registeredTasks) {
      if (!task.isActive) continue;

      const isMatch = this.matchesCron(task.cronExpression, currentHour, currentMinute);
      if (isMatch) {
        console.log(`[Zuu Cron Scheduler] Cron match for "${task.name}" at ${now.toLocaleTimeString()}`);
        this.triggerTask(task);
      }
    }
  }

  /**
   * Basic cron pattern matcher (supports "m h * * *" and "STAR/N * * * *")
   */
  private static matchesCron(cron: string, hour: number, minute: number): boolean {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 2) return false;

    const [minPart, hourPart] = parts;

    // Minute check
    let minuteMatch = false;
    if (minPart === '*') {
      minuteMatch = true;
    } else if (minPart.startsWith('*/')) {
      const step = parseInt(minPart.slice(2), 10);
      minuteMatch = !isNaN(step) && step > 0 && (minute % step === 0);
    } else {
      minuteMatch = parseInt(minPart, 10) === minute;
    }

    // Hour check
    let hourMatch = false;
    if (hourPart === '*') {
      hourMatch = true;
    } else {
      hourMatch = parseInt(hourPart, 10) === hour;
    }

    return minuteMatch && hourMatch;
  }

  /**
   * Executes the scheduled workflow on the server
   */
  private static async triggerTask(task: ScheduledTask) {
    try {
      const mockReq = {
        method: 'POST',
        headers: {},
        query: {},
        body: {
          workflowId: task.id,
          workflowName: task.name,
          isDryRun: true,
          triggerPayload: {
            source: 'cron_scheduler_24x7',
            topic: task.topic,
            scheduledTime: new Date().toISOString()
          },
          nodes: [
            {
              id: 'node_cron',
              type: 'trigger_schedule',
              category: 'trigger',
              title: 'Scheduled Cron Trigger',
              config: { cron: task.cronExpression, topic: task.topic }
            },
            {
              id: 'node_ai',
              type: 'ai_agent',
              category: 'ai',
              title: 'Autonomous Content Agent',
              config: {
                agentName: 'Scheduled Content Synthesizer',
                topic: task.topic,
                promptTemplate: 'Write a viral post about "{{topic}}". Include hashtags and emojis.',
                model: 'gemini-2.0-flash'
              }
            },
            {
              id: 'node_pub',
              type: 'facebook_publish',
              category: 'action',
              title: 'Facebook Page Publisher',
              config: { pageId: '109847291834910', dryRun: true }
            }
          ],
          connections: [
            { from: 'node_cron', to: 'node_ai' },
            { from: 'node_ai', to: 'node_pub' }
          ]
        }
      };

      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`[Zuu Cron Scheduler] Execution finished for "${task.name}": status ${code}, duration: ${data.totalDurationMs}ms`);
          }
        }),
        setHeader: () => mockRes
      };

      await handleWorkflowRun(mockReq, mockRes);
    } catch (err: any) {
      console.error(`[Zuu Cron Scheduler] Error executing "${task.name}":`, err.message);
    }
  }
}
