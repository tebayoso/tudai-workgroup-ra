export interface Tp {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  created_by: string
}

export interface TpAttachment {
  id: string
  tp_id: string
  file_url: string
  uploaded_at: string
}

export interface TpDetailsProps {
  id: string
}

export interface RegisterOptionsProps {
  tpId: string
}