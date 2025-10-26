import Editor, { type OnMount } from "@monaco-editor/react";
import type { File } from "../utils/file-manager";
import { useEffect, useState } from "react";

export default function Code({ selectedFile }: { selectedFile: File | undefined; }) {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<string>();

    const handleMount: OnMount = (_editor, monacoInstance) => {
        monacoInstance.languages.register({ id: 'latex' });

        monacoInstance.languages.setMonarchTokensProvider('latex', {
            tokenizer: {
                root: [
                    [/%.*$/, 'comment'],
                    [/\\[a-zA-Z]+/, 'keyword'],
                    [/{[^}]*}/, 'string'],
                    [/\$[^$]*\$/, 'number'],
                    [/\\begin\{[a-zA-Z*]+\}/, 'keyword'],
                    [/\\end\{[a-zA-Z*]+\}/, 'keyword'],
                ],
            },
        });

        monacoInstance.editor.defineTheme('latex-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
            ],
            colors: { 'editor.background': '#1e1e1e' },
        });

        monacoInstance.editor.setTheme('latex-dark');
    };

    useEffect(() => {
        (async () => {
            if (!selectedFile) {
                setLanguage(undefined);
                setCode('');
                return;
            }


            let language = selectedFile.name.split('.').pop();

            if (language === "js" || language === "jsx") {
                language = "javascript";
            } else if (language === "ts" || language === "tsx") {
                language = "typescript";
            } else if (language === "tex") {
                language = "latex";
            }

            setLanguage(language);

            if (selectedFile.fileHandle) {
                const file = await selectedFile.fileHandle.getFile();
                const text = await file.text();
                setCode(text);
            }
            if (selectedFile.content) {
                setCode(selectedFile.content);
            }
        })();
    }, [selectedFile]);

    function onChange(newValue?: string) {
        if (newValue && selectedFile?.content) {
            selectedFile.content = newValue;
        }
    }

    return (
        <div style={{
            width: 'calc(100% - 250px)',
            height: window.innerHeight - 25,
            margin: 0,
            fontSize: 16,
        }}>
            <Editor
                language={language}
                value={code}
                theme="vs-dark"
                onMount={handleMount}
                onChange={onChange}
            />
        </div >
    );
};
