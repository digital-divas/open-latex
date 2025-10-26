export { };

declare global {
    interface FileSystemDirectoryHandle {
        values(): AsyncIterable<FileSystemHandle>;
        entries(): AsyncIterable<[string, FileSystemHandle]>;
        keys(): AsyncIterable<string>;
    }
    interface Window {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    }
}
