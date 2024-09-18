import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'User',
  synchronize: false,
})
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  platform: string;
}
