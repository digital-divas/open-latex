import React, { useState } from 'react';
import { type Directory, type File, sortDir, sortFile } from "../utils/file-manager";
import { getIcon } from "./icon";

interface FileTreeProps {
    rootDir: Directory;   // 根目录
    selectedFile: File | undefined;   // 当前选中文件
    onSelect: (file: File) => void;  // 更改选中时触发事件
}

export const FileTree = (props: FileTreeProps) => {
    return <SubTree directory={props.rootDir} {...props} />;
};

interface SubTreeProps {
    directory: Directory;   // 根目录
    selectedFile: File | undefined;   // 当前选中文件
    onSelect: (file: File) => void;  // 更改选中时触发事件
}

const SubTree = (props: SubTreeProps) => {
    return (
        <div>
            {
                props.directory.dirs
                    .sort(sortDir)
                    .map(dir => (
                        <React.Fragment key={dir.id}>
                            <DirDiv
                                directory={dir}
                                selectedFile={props.selectedFile}
                                onSelect={props.onSelect} />
                        </React.Fragment>
                    ))
            }
            {
                props.directory.files
                    .sort(sortFile)
                    .map(file => (
                        <React.Fragment key={file.id}>
                            <FileDiv
                                file={file}
                                selectedFile={props.selectedFile}
                                onClick={() => props.onSelect(file)} />
                        </React.Fragment>
                    ))
            }
        </div>
    );
};

const FileDiv = ({ file, icon, selectedFile, onClick }: {
    file: File | Directory; // 当前文件
    icon?: string;          // 图标名称
    selectedFile: File | undefined;     // 选中的文件
    onClick: () => void;    // 点击事件
}) => {
    const isSelected = (selectedFile && selectedFile.id === file.id) as boolean;
    const depth = file.depth;
    const [isHovered, setHovered] = useState(false);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: depth * 16,
                backgroundColor: isSelected || isHovered ? "#242424" : "transparent",
                cursor: isHovered ? 'pointer' : undefined,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}>
            <FileIcon
                name={icon}
                extension={file.name.split('.').pop() || ""} />
            <span style={{ marginLeft: 1 }}>
                {file.name}
            </span>
        </div>
    );
};

const DirDiv = ({ directory, selectedFile, onSelect }: {
    directory: Directory;  // 当前目录
    selectedFile: File | undefined;    // 选中的文件
    onSelect: (file: File) => void;  // 点击事件
}) => {
    let defaultOpen = false;
    if (selectedFile)
        defaultOpen = isChildSelected(directory, selectedFile);
    const [open, setOpen] = useState(defaultOpen);
    return (
        <>
            <FileDiv
                file={directory}
                icon={open ? "openDirectory" : "closedDirectory"}
                selectedFile={selectedFile}
                onClick={() => setOpen(!open)} />
            {
                open ? (
                    <SubTree
                        directory={directory}
                        selectedFile={selectedFile}
                        onSelect={onSelect} />
                ) : null
            }
        </>
    );
};


const isChildSelected = (directory: Directory, selectedFile: File) => {
    let res: boolean = false;

    function isChild(dir: Directory, file: File) {
        if (selectedFile.parentId === dir.id) {
            res = true;
            return;
        }
        if (selectedFile.parentId === '0') {
            res = false;
            return;
        }
        dir.dirs.forEach((item) => {
            isChild(item, file);
        });
    }

    isChild(directory, selectedFile);
    return res;
};

const FileIcon = ({ extension, name }: { name?: string, extension?: string; }) => {
    let icon = getIcon(extension || "", name || "");
    return (
        <span style={{
            display: 'flex',
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',

        }}>
            {icon}
        </span>
    );
};