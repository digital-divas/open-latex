export enum FileType {
    FILE,
    DIRECTORY,
    DUMMY,
}

interface CommonProps {
    id: string; // 文件id
    type: FileType; // 文件类型
    name: string; // 名称
    parentId: string | undefined; // 父级目录，如果为根目录则undefined
    depth: number; // 文件深度
}

export interface File extends CommonProps {
    fileHandle?: FileSystemFileHandle;
    content?: string;
}

export interface Directory extends CommonProps {
    files: File[];
    dirs: Directory[];
}


export function findFileByName(
    rootDir: Directory,
    filename: string
): File | undefined {
    let targetFile: File | undefined = undefined;

    function findFile(rootDir: Directory, filename: string) {
        rootDir.files.forEach((file) => {
            if (file.name === filename) {
                targetFile = file;
                return;
            }
        });
        rootDir.dirs.forEach((dir) => {
            findFile(dir, filename);
        });
    }

    findFile(rootDir, filename);
    return targetFile;
}

export function sortDir(l: Directory, r: Directory) {
    return l.name.localeCompare(r.name);
}

export function sortFile(l: File, r: File) {
    return l.name.localeCompare(r.name);
}
