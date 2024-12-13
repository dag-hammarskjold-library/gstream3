export interface DocumentFile {
    languageId: string
    odsNo: string
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
    links?: DocumentLink[]
}

export interface TableHeader {
    key: keyof Document
    label: string
}