type WorkerCommand =
  | "ready"
  | "stdout"
  | "stderr"
  | "FS_createDataFile"
  | "FS_readFile"
  | "FS_unlink"
  | "FS_createFolder"
  | "FS_createPath"
  | "FS_createLazyFile"
  | "FS_createLazyFilesFromList"
  | "set_TOTAL_MEMORY"
  | "run"
  | "test";

interface WorkerMessage {
  command: WorkerCommand;
  contents?: string;
  msg_id?: number;
  result?: any;
}

export class PDFTeX {
  private worker: Worker;
  private promises: { [id: number]: (value: any) => void; } = {};
  private initialized = false;
  private chunkSize?: number;
  private ready: Promise<void>;
  private resolveReady!: () => void;

  public FS_createDataFile!: (...args: any[]) => Promise<any>;
  public FS_readFile!: (...args: any[]) => Promise<any>;
  public set_TOTAL_MEMORY!: (bytes: number) => Promise<any>;
  public FS_createLazyFile!: (...args: any[]) => Promise<any>;


  public on_stdout: (msg: string) => void = console.log;
  public on_stderr: (msg: string) => void = console.error;

  constructor(workerPath: string = "pdftex-worker.js") {
    this.worker = new Worker(workerPath);

    // Promise que resolve quando o worker está pronto
    this.ready = new Promise<void>((resolve) => (this.resolveReady = resolve));

    this.worker.onmessage = (ev: MessageEvent) => {
      const data: WorkerMessage = JSON.parse(ev.data);
      if (!data.command) {
        console.warn("Mensagem do worker sem comando:", data);
        return;
      }

      switch (data.command) {
        case "ready":
          this.resolveReady();
          break;
        case "stdout":
          if (data.contents) this.on_stdout(data.contents);
          break;
        case "stderr":
          if (data.contents) this.on_stderr(data.contents);
          break;
        default:
          if (data.msg_id !== undefined && this.promises[data.msg_id]) {
            this.promises[data.msg_id](data.result);
            delete this.promises[data.msg_id];
          } else {
            console.warn("Mensagem desconhecida do worker:", data);
          }
      }
    };
  }

  /** Envia um comando para o worker e aguarda resposta */
  private async sendCommand(cmd: Record<string, any>): Promise<any> {
    await this.ready;
    const msg_id = Object.keys(this.promises).length;
    const promise = new Promise((resolve) => {
      this.promises[msg_id] = resolve;
    });

    cmd["msg_id"] = msg_id;
    this.worker.postMessage(JSON.stringify(cmd));
    return promise;
  }

  private determineChunkSize(): number {
    let size = 1024;
    let max: number | undefined;
    let min: number | undefined;
    let delta = size;
    let success = true;

    while (Math.abs(delta) > 100) {
      if (success) {
        min = size;
        delta = max === undefined ? size : (max - size) / 2;
      } else {
        max = size;
        delta = min === undefined ? -size / 2 : -(size - min) / 2;
      }
      size += delta;

      success = true;
      try {
        const buf = String.fromCharCode.apply(null, new Uint8Array(size) as unknown as number[]);
        this.sendCommand({ command: "test", data: buf });
      } catch {
        success = false;
      }
    }

    return size;
  }

  /** Cria métodos dinamicamente que chamam o worker */
  private createCommand(command: WorkerCommand) {
    (this as any)[command] = (...args: any[]) =>
      this.sendCommand({ command, arguments: args });
  }

  /** Inicializa os comandos do FS */
  public initializeFSMethods() {
    [
      "FS_createDataFile",
      "FS_readFile",
      "FS_unlink",
      "FS_createFolder",
      "FS_createPath",
      "FS_createLazyFile",
      "FS_createLazyFilesFromList",
      "set_TOTAL_MEMORY",
    ].forEach((cmd) => this.createCommand(cmd as WorkerCommand));
  }

  /** Compila o código LaTeX e retorna um DataURL do PDF */
  public async compile(sourceCode: string): Promise<string | false> {
    const binaryPDF = await this.compileRaw(sourceCode);
    if (!binaryPDF) return false;
    return (
      "data:application/pdf;charset=binary;base64," +
      window.btoa(binaryPDF)
    );
  }

  /** Compila o LaTeX e retorna o conteúdo binário do PDF */
  public async compileRaw(sourceCode: string): Promise<string | false> {
    if (this.chunkSize === undefined) this.chunkSize = this.determineChunkSize();

    const commands: (() => Promise<any>)[] = [];

    if (this.initialized) {
      commands.push(() => this.sendCommand({ command: "FS_unlink", arguments: ["/input.tex"] }));
    } else {
      commands.push(() =>
        this.sendCommand({
          command: "FS_createDataFile",
          arguments: ["/", "input.tex", sourceCode, true, true],
        }),
      );
      commands.push(() =>
        this.sendCommand({
          command: "FS_createLazyFilesFromList",
          arguments: ["/", "texlive.lst", "./texlive", true, true],
        }),
      );
    }

    for (const cmd of commands) await cmd();

    this.initialized = true;

    await this.sendCommand({
      command: "run",
      arguments: ["-interaction=nonstopmode", "-output-format", "pdf", "input.tex"],
    });

    return this.sendCommand({ command: "FS_readFile", arguments: ["/input.pdf"] });
  }
}