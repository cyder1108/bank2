const test = require(`ava`);
const Bank = require(`./`);

test(`constructor`, async t => {
  const users = new Bank({
    name: { type: "string", require: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  t.pass();
})

test("add", async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
  });
  users.add({ name: "太郎", age: 23 });
  t.is( users.length, 1 )
  users.add();
  t.is( users.length, 1 )
  users.add({ name: "太郎", age: 24 });
  t.is( users.length, 1 )
  users.add({ name: "花子", age: 23 });
  t.is( users.length, 2 )

  users.add({ name: "テスト1", age: 18 })
  users.add({ name: "テスト2", age: 12 })
  users.add({ name: "テスト3", age: 13 })
  t.is( users.length, 5 )
  const teenager = users.filter( u => u.age < 20 )
  t.is( teenager.length, 3)
})

test(`where`, async t => {
  const users = new Bank({
    name: { type: "string", require: true },
    sex:  { type: "string", require: true },
    age:  { type: "number", require: true },
  });
  users.add({ name: "太郎", age: 24, sex: "male" });
  users.add({ name: "太郎1",age: 13, sex: "male" });
  users.add({ name: "太郎2",age: 14, sex: "male" });
  users.add({ name: "太郎3",age: 24, sex: "male" });
  users.add({ name: "花子", age: 24, sex: "female" });
  users.add({ name: "花子1",age: 19, sex: "female" });
  users.add({ name: "花子2",age: 12, sex: "female" });
  users.add({ name: "花子3",age: 24, sex: "female" });
  t.is( users.length, 8 )
  const maleUsers = users.where({sex: "male"});
  t.is( maleUsers.length, 4);
  const maleTeenAgers = maleUsers.filter( u => u.age < 20 );
  t.is( maleTeenAgers.length, 2 );
});

test(`find`, async t => {
  const users = new Bank({
    name: { type: "string", require: true },
    age:  { type: "number", require: true },
  })
  users.add({ name: "テスト1", age: 18 })
  users.add({ name: "テスト2", age: 12 })
  users.add({ name: "テスト3", age: 13 })
  users.add({ name: "テスト4", age: 13 })
  t.is( users.find( users.at(1)._id ).age, 12 )
  t.is( users.find( u => u.age === 13 ).name, "テスト3" )
  t.is( users.find({ age: 13 }).name, "テスト3" )
})

test(`each`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 1000; i++ ) {
    users.add({ name: `test${i}`, age: i, sex: `male` })
  }
  users.each( ( u, i ) => {
    t.is( u.name, `test${i}`)
  })
});

test(`map`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 1000; i++ ) {
    users.add({ name: `test${i}`, age: i, sex: `male` })
  }
  const sexs = users.map( u => u.sex )
  t.is( sexs[0], "male" )
  t.is( sexs[6], "male" )
});

test(`save`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  const user = { name: "太郎", age: 24, sex: "male" }
  users.save( user )
  t.is( users.length, 1);
  t.is( users.at(0).name, "太郎")
  user.name = "テスト太郎";
  t.is( users.at(0).name, "太郎")
  t.true( users.save( user ) );
  t.is( users.at(0).name, "テスト太郎")
  t.is( users.length, 1);

  t.true( users.save({name: "テスト花子", age: 23, sex: "female"}));
  t.is( users.length, 2 );
});


test(`remove`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  const user1 = users.new({ name: "太郎", age: 24, sex: "male" })
  const user2 = users.new({ name: "花子", age: 24, sex: "female" })
  users.save( user1 )
  users.save( user2 )

  t.is( users.length, 2);
  t.true( users.remove( user1 ) )
  t.is( users.length, 1);
  t.true( users.remove(user2) )
  t.is( users.length, 0);

  t.true( users.add({ name: "mr.test1", age: 21, sex: "male" }) )
  t.true( users.add({ name: "mr.test2", age: 21, sex: "male" }) )
  t.true( users.add({ name: "mr.test3", age: 21, sex: "male" }) )
  t.true( users.add({ name: "ms.test1", age: 21, sex: "female" }) )
  t.true( users.add({ name: "ms.test2", age: 21, sex: "female" }) )
  t.true( users.add({ name: "ms.test3", age: 21, sex: "female" }) )
  femaleUsers = users.where({ sex: "female" })
  t.is( femaleUsers.length , 3);
});

test(`sort`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  t.true( users.add({ name: "mr.test1", age: 25, sex: "male" }) )
  t.true( users.add({ name: "mr.test2", age: 56, sex: "male" }) )
  t.true( users.add({ name: "mr.test3", age: 34, sex: "male" }) )
  t.true( users.add({ name: "ms.test1", age: 12, sex: "female" }) )
  t.true( users.add({ name: "ms.test2", age: 88, sex: "female" }) )
  t.true( users.add({ name: "ms.test3", age: 45, sex: "female" }) )
  const sortedUsers = users.sort("DESC", u => u.age );
  //femaleUsers = users.where({ sex: "female" })
  //t.is( femaleUsers.length , 3);
});


test(`scope`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  users.scope(`性別`, ( d, word)  => d.where({ sex: word }));
  users.scope(`男性`, d => d.where({ sex: "male" }));
  t.true( users.add({ name: "mr.test1", age: 25, sex: "male" }) )
  t.true( users.add({ name: "mr.test2", age: 56, sex: "male" }) )
  t.true( users.add({ name: "mr.test3", age: 34, sex: "male" }) )
  t.true( users.add({ name: "ms.test1", age: 12, sex: "female" }) )
  t.true( users.add({ name: "ms.test2", age: 88, sex: "female" }) )

  t.is( users.with("男性").length, 3);
  t.is( users.with("性別", "female").length, 2);

})

test(`beforeFilter`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });

  users.beforeSet(`sex`, v => {
    if( v === "男性") return "male";
    if( v === "女性") return "female";
    return null
  })

  users.beforeGet(`name`, v => {
    return v + " 様";
  });

  users.add({ name: "hoge", age: 12, sex: "男性" })
  t.is( users.at(0).sex, "male");
  t.is( users.at(0).name, "hoge 様");

});


test(`virtualGet`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  users.virtualGet(`氏名`, d => d.name)
  users.add({ name: "hoge", age: 12, sex: "男性" })
  t.is( users.at(0)["氏名"], "hoge");
});

test(`virtualSet`, async t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true },
    sex:  { type: "string", require: true },
  });
  users.virtualSet(`氏名`, (v, attr) => Object.assign({}, attr, {name: v}))
  users.add({ "氏名": "hoge", age: 12, sex: "男性" })
  t.is( users.at(0).name, "hoge");
});


/*
// 負荷テスト1
test(`loadtest1`, t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 100000; i++ ) {
    if( i % 2 === 0 ) {
      users.add({ name: `test${i}`, age: i, sex: `male` })
    } else {
      users.add({ name: `test${i}`, age: i, sex: `female` })
    }
  }
  t.is( users.length, 100000)
  const femaleUsers = users.where({ sex: `female` });
  t.is( femaleUsers.length, 50000 )
});

/*
// 負荷テスト2
test(`loadtest2`, t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 100000; i++ ) {
    if( i % 2 === 0 ) {
      users.add({ name: `test${i}`, age: i, sex: `male` })
    } else {
      users.add({ name: `test${i}`, age: i, sex: `female` })
    }
  }
  t.is( users.length, 100000)
  const femaleUsers = users.filter( u => u.sex === `female`);
  t.is( femaleUsers.length, 50000 )
  users.each( (u,i ) => users.save( Object.assign(u, {name: `t${i}`}) ))
});

/*
// 負荷テスト3
test(`loadtest3`, t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 5000; i++ ) {
    users.add({ name: `test${i}`, age: i, sex: `female` })
  }
  //t.is( users.length, 100000)
  users.each( u => users.remove(u) )
  t.is(users.length, 0)
  //const femaleUsers = users.where({ sex: `female` });
  //t.is( femaleUsers.length, 50000 )
});
*/

/*
test(`loadtest4`, t => {
  const users = new Bank({
    name: { type: "string", require: true, unique: true },
    age:  { type: "number", require: true, unique: true },
    sex:  { type: "string", require: true },
  });
  for( var i = 0; i < 100000; i++ ) {
    if( i % 2 === 0 ) {
      users.add({ name: `test${i}`, age: Math.floor( Math.random() * 100 ), sex: `male` })
    } else {
      users.add({ name: `test${i}`, age: Math.floor( Math.random() * 100 ), sex: `female` })
    }
  }
  const sortedUsers = users.sort(`desc`, u => u.age )
  t.pass()
});
/* */
