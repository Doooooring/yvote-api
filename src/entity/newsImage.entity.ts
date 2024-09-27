import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'NewsImage',
})
export class ImageUrl {
  @PrimaryColumn()
  id: number;

  @Column()
  img: string;
}
