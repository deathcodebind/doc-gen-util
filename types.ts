
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AuthMethod = 'None' | 'Token' | 'Cookie' | 'OAuth2' | 'API Key' | 'Signature';

export type DescriptionFormat = 'docgenie' | 'markdown';

export interface AuthRule {
  role: string;
  method: AuthMethod;
  details?: string;
}

export interface CustomType {
  name: string;
  definition: string; // Syntax: { name: string, email?: string, secret(Owner): string }
  roles: string[]; // Contextual roles specific to this type, e.g. ["Owner", "Member"]
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  arguments: string | null;
  response: string | null;
  authRules: AuthRule[];
}

export interface ApiDoc {
  title: string;
  description: string;
  descriptionFormat: DescriptionFormat;
  customTypes: CustomType[];
  endpoints: Endpoint[];
}

export interface ListItem {
  level: number;
  text: string;
  children: ListItem[];
  isList: boolean;
  isOrdered?: boolean;
  listNumber?: string;
}

export interface TypeProperty {
  name: string;
  type: string;
  isOptional: boolean;
  requiredRole: string | null;
}
