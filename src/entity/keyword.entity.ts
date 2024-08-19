import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class Keyword {
  @PrimaryColumn()
  id: string;

  @Column()
  @Index()
  keyword: string;

  @Column()
  explain: string;

  @Column()
  category: string;

  @Column()
  recent: boolean;
}
