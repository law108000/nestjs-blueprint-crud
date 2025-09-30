export interface Criteria<T = any> {
  where?: EntityWhereCriteria<T>;
  limit?: number;
  skip?: number;
  sort?: SortOption[] | string;
  populate?: string[] | string;
  select?: string;
  omit?: string;
}

export interface CountCriteria<T = any> {
  where?: EntityWhereCriteria<T> | object;
}

export type Modifier = '<' | '<=' | '>' | '>=' | '!=' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';

export type EntityWhereCriteria<T> = {
  [P in keyof T]?: any | T[P] | {
    '<'?: T[P];
    '<='?: T[P];
    '>'?: T[P];
    '>='?: T[P];
    '!='?: T[P];
    in?: T[P][];
    nin?: T[P][];
    contains?: string;
    startsWith?: string;
    endsWith?: string;
  };
} & {
  and?: EntityWhereCriteria<T>[];
  or?: EntityWhereCriteria<T>[];
} & {
  [key: string]: any;
};

export interface SortOption {
  [key: string]: 'ASC' | 'DESC';
}

export interface IQueryCriteria {
  and?: IQueryCriteria[];
  or?: IQueryCriteria[];
}

export interface IListQueryDto {
  where?: IQueryCriteria;
  limit?: number;
  skip?: number;
  sort?: string;
  select?: string;
  omit?: string;
  populate?: string;
}

export interface ICountQueryDto {
  where?: IQueryCriteria;
}

export interface ICreateDto {
  [key: string]: number | string | boolean | Date;
}

export interface IUpdateDto {
  [key: string]: number | string | boolean | Date;
}