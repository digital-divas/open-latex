import { useState } from 'react';
import './App.css';
import Code from './editor/code';
import { FileType, type Directory, type File } from './utils/file-manager';
import { FileTree } from './components/file-tree';
import Sidebar from './components/sidebar';
import HeaderBar from './components/header-bar';
import { PDFTeX } from './pdftex/pdftex';
import Tabs from './components/tabs';

const dummyDir: Directory = {
  id: "1",
  name: "loading...",
  type: FileType.DUMMY,
  parentId: undefined,
  depth: 0,
  dirs: [],
  files: []
};

function PDFViewer({ dataUrl }: { dataUrl?: string; }) {
  return (
    <>
      {dataUrl &&
        <iframe
          src={dataUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title="PDF preview"
        />
      }
    </>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [rootDir, setRootDir] = useState(dummyDir);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>();
  const [selectedTab, setSelectedTab] = useState<string>();
  const [isCompiling, setCompiling] = useState(false);

  async function readDirectory({ dirHandle, depth = 0, initialPath = '/', name, parentId }: {
    dirHandle: FileSystemDirectoryHandle,
    depth?: number,
    initialPath?: string,
    name: string,
    parentId?: string;
  }) {
    const directory: Directory = {
      depth: depth - 1,
      dirs: [],
      files: [],
      id: initialPath,
      name: name,
      parentId,
      type: FileType.DIRECTORY,
      dirHandle: dirHandle,
    };

    for await (const entry of dirHandle.values()) {

      if (entry.kind === 'file') {
        const fileHandle = await dirHandle.getFileHandle(entry.name);
        directory.files.push({
          fileHandle,
          depth: depth,
          id: `${initialPath}/${entry.name}`,
          name: entry.name,
          type: FileType.FILE,
          parentId: directory.id,
        });
      } else if (entry.kind === 'directory') {
        const subDirectoryHandle = await dirHandle.getDirectoryHandle(entry.name);
        const subDirectory = await readDirectory({
          dirHandle: subDirectoryHandle,
          depth: depth + 1,
          initialPath: `${initialPath}/${entry.name}`,
          name: entry.name,
          parentId: directory.id,
        });
        directory.dirs.push(subDirectory);
      }

    }

    return directory;
  }

  async function selectFolder() {
    const dirHandle = await window.showDirectoryPicker();

    const directory = await readDirectory({
      dirHandle,
      name: '',
    });

    setRootDir(directory);
    setSelectedFile(undefined);

  }

  function binaryStringToUint8Array(binaryString: string) {
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function compileLatex() {
    try {
      setCompiling(true);

      const file = rootDir.files.find(file => file.name === 'main.tex');

      if (!file) {
        return;
      }

      let content = file.content;

      if (!content && file.fileHandle) {
        const thisFile = await file.fileHandle.getFile();
        content = await thisFile.text();
      }

      if (!content) {
        return;
      }

      var pdfTex = new PDFTeX();
      pdfTex.initializeFSMethods();
      await pdfTex.set_TOTAL_MEMORY(80 * 1024 * 1024);

      pdfTex.on_stdout = (msg) => console.info(msg);
      pdfTex.on_stderr = (msg) => console.error(msg);

      const libs = rootDir.dirs.find(file => file.name === 'libs');

      if (libs?.dirHandle) {
        for await (const entry of libs.dirHandle.values()) {
          const fileHandle = await libs.dirHandle.getFileHandle(entry.name);
          const libFile = await fileHandle.getFile();
          const libContent = await libFile.text();

          console.log('creating lib file:', entry.name);
          await pdfTex.FS_createDataFile('/', entry.name, libContent, true, true);
        }
      }

      const latexFiles = [
        'tex',
        'aux',
        'lof',
        'toc',
      ];

      for (const item of rootDir.files) {

        if (item.name === 'main.tex') {
          continue;
        }

        const isLatexFile = latexFiles.some(latexFile => item.name.endsWith(`.${latexFile}`));

        if (!isLatexFile || !item.fileHandle) {
          continue;
        }

        const libFile = await item.fileHandle.getFile();
        const libContent = await libFile.text();

        await pdfTex.FS_createDataFile('/', item.name.startsWith('main.') ? item.name.replace('main.', 'input.') : item.name, libContent.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), true, true);

      }


      const binary_pdf = await pdfTex.compileRaw(content);

      if (!binary_pdf) {
        return;
      }

      const uint8pdf = binaryStringToUint8Array(binary_pdf);
      const blob = new Blob([uint8pdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfDataUrl(url);
      setSelectedTab('pdf');

    } catch (err) {
      console.error(err);
    } finally {
      setCompiling(false);
    }
  }

  async function newTexFile() {
    const file: File = {
      depth: 0,
      id: '/main.tex',
      name: 'main.tex',
      parentId: '/',
      type: FileType.FILE,
      content: `\\documentclass{article}\n\\begin{document}\nHello, LaTeX!\n\\end{document}`,
    };

    setRootDir({
      depth: 0,
      dirs: [],
      files: [file],
      id: '/',
      name: '',
      parentId: undefined,
      type: FileType.DIRECTORY,
    });

    setSelectedFile(file);
  }


  return (<div>
    <HeaderBar
      items={[{
        label: 'New TeX File',
        onClick: newTexFile,
      }, {
        label: 'Open Folder...',
        onClick: selectFolder,
        disabled: !window.showDirectoryPicker,
      }, {
        label: 'Compile LaTeX',
        onClick: compileLatex,
        disabled: !rootDir.files.find(file => file.name === 'main.tex'),
        compileButton: true,
      }]}
      isCompiling={isCompiling}
    />
    <div style={{
      display: 'flex',
    }}>
      <Sidebar>
        <FileTree
          rootDir={rootDir}
          selectedFile={selectedFile}
          onSelect={(file) => {
            setSelectedFile(file);
            setSelectedTab('code');
          }}
        />
      </Sidebar>
      <div style={{
        display: 'flex',
        flex: 1,
        height: window.innerHeight - 25
      }}>
        <Tabs
          tabs={[{
            key: 'code',
            label: selectedFile?.name || 'code',
          }, {
            key: 'pdf',
            label: 'pdf'
          }]}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        >
          {({ selectedTab }) => {
            if (selectedTab === 'code') {
              return <Code
                selectedFile={selectedFile}
              />;
            }
            if (selectedTab === 'pdf') {
              return <PDFViewer
                dataUrl={pdfDataUrl}
              />;
            }
          }}
        </Tabs>
      </div>
    </div>
  </div>
  );
}

export default App;
