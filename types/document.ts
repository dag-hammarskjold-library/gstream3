export interface DocumentFile {
    languageId: string
    odsNo: string
    fileId?: string
}

export interface DocumentEvent {
    date: string
    dates?: string[]
    info?: string
    message?: string
    data?: {
        symbol: string
        language: string
    }
}

export interface DocumentLink {
    name: string
    url: string
}

export interface Document {
    symbol1: string
    symbol2: string
    title: string
    agendaNo?: string
    jobId?: string
    area?: string
    sessionNo?: string
    distributionType?: string
    files: DocumentFile[]
    _id: string
    historyUrl?: string
    history?: DocumentEvent[]
    links?: DocumentLink[]
}
export interface TableHeader {
    key: keyof Document
    label: string
}
