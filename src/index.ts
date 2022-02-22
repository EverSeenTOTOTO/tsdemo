/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
class Actor {
  slapped: boolean;

  name: string;

  constructor(name: string) {
    this.name = name;
    this.slapped = false;
  }

  update() {
    // do nothing
  }

  slap() {
    this.slapped = true;
  }

  reset() {
    this.slapped = false;
  }

  wasSlapped() {
    return this.slapped;
  }
}

class Stage {
  actors: Actor[];

  constructor() {
    this.actors = [];
  }

  addActor(actor: Actor) {
    this.actors.push(actor);
  }

  update() {
    console.log('---- Stage updating ----');
    for (const actor of this.actors) {
      actor.update();
      actor.reset();
    }
  }

  display() {
    console.log('[');
    console.log(this.actors.map((actor) => `\t${actor.name}, facing ${(actor as Comedian).facing?.name}`).join('\n'));
    console.log(']');
  }
}

class Comedian extends Actor {
  facing: Actor|null = null;

  face(actor: Actor) {
    this.facing = actor;
  }

  update() {
    if (this.wasSlapped()) {
      this.facing?.slap();
      console.log(`${this.name} was slapped, so he slaps ${this.facing?.name}`);
    } else {
      console.log(`${this.name} looks around`);
    }
  }
}

(function main() {
  const stage = new Stage();

  const harry = new Comedian('Harry');
  const baldy = new Comedian('Baldy');
  const chump = new Comedian('Chump');

  harry.face(baldy);
  baldy.face(chump);
  chump.face(harry);

  stage.addActor(baldy);
  stage.addActor(harry);
  stage.addActor(chump);

  stage.display();

  harry.slap();
  stage.update();
  stage.update();
  stage.update();
  stage.update();
  stage.update();
  stage.update();
}());
