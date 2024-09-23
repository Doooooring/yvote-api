import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'NewsImage',
})
export class NewsImage {
  @PrimaryColumn()
  id: number;

  @Column()
  img: string;
}
