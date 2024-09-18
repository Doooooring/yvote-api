import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'Keyword',
  synchronize: false,
})
export class Keyword {
  @PrimaryColumn()
  id: number;

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
