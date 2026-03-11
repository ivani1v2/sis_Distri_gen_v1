class ImpresionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.currentDocId = null;
    this.timeoutMs = 300000;
  }

  async add(job) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        job,
        resolve,
        reject,
        id: Date.now() + Math.random()
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const next = this.queue.shift();
    this.currentDocId = next.id;

    try {
      const result = await Promise.race([
        next.job(next.id),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout en impresión')), this.timeoutMs)
        )
      ]);
      
      next.resolve(result);
    } catch (error) {
      next.reject(error);
    } finally {
      this.currentDocId = null;
      setTimeout(() => this.process(), 1000);
    }
  }

  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Cola de impresión cancelada'));
    });
    this.queue = [];
    this.processing = false;
  }
}

export const impresionQueue = new ImpresionQueue();