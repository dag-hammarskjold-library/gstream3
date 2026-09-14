export interface DocumentFile {
    languageId: string
    odsNo: string
    fileId?: string
}

export interface DocumentEvent {
    date: string
    message: string
}

export interface DocumentLink {
    name: string
    url: string
}

export interface Document {
    symbol1: string
    symbol2: string
    title: string
    files: DocumentFile[]
    _id?: string
    history?: DocumentEvent[]
    links?: DocumentLink[]
}
export interface TableHeader {
    key: keyof Document
    label: string
}
