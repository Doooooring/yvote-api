import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Timeline {
  @PrimaryColumn()
  id: string;

  @Column()
  date: Date;

  @Column()
  title: string;
}
