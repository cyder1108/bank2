const EventEmitter = require(`events`).EventEmitter;
const _ = require(`lodash`);

const _collection = Symbol("collection");
const _createEntity = Symbol("createEntity");
const _createID = Symbol("createID");
const _schema = Symbol("schema");
const _createDefaultAttributes = Symbol(`createDefaultAttributes`);
const _createChildCollection = Symbol(`createDefaultAttributes`);
const _attributes = Symbol(`attributes`);
const _filters = Symbol(`filters`);
const _errors = Symbol(`errors`);
const _index = Symbol(`index`);

module.exports = class Bank extends EventEmitter {

  constructor( schema ) {
    super();
    this[_collection] = [];
    const defaultSchema = {
      type: "string",
      require: false,
      unique: false,
      empty: true,
      default: null,
    }


    if( schema !== void(0) ) {
      this.uniqueKeys = [];
      this[_schema] = {};
      const schemaKeys = Object.keys( schema );
      const schemaKeysLen = schemaKeys.length;
      for( var i = 0; i < schemaKeysLen; i++ ) {
        var key = schemaKeys[i];
        this[_schema][key] = Object.assign( {},defaultSchema, schema[key] )
        if( this[_schema][key].unique ) this.uniqueKeys.push( key );
      }
      this[_schema]._id = Object.assign( {},defaultSchema, { require: true, unique: true } );
      this.uniqueKeys.push( `_id` )
      this.uniqueVals = {};
      for( var i = 0; i < this.uniqueKeys.length; i++ ) {
        this.uniqueVals[this.uniqueKeys[i]] = {};
      }
    }

    this[_index] = {};

    this[_filters] = {
      beforeSet: {},
      beforeGet: {},
      virtualSet: {},
      virtualGet: {},
    };
    this.scopes = {};

    this.length = 0;
    this[_errors] = [];
    this.parent = null;
    this.errorMessages = {
      typeMismatch: `__KEY__ is mismatched type.`,
      notPresent: `__KEY__ is not present.`,
      notUnique: `__KEY__ is dupplicated`,
    }
  }

  all() {
    return this[_collection].concat();
  }

  root() {
    if( this.parent === null ) return this;
    return this.parent.root();
  }

  schema() {
    return this.root()[_schema];
  }

  find( search ) {
    if( typeof( search ) === "string" ) {
      return this[_index][search];
      var matches = this.where({ _id: search } )
    } else if( typeof(search) === "function" ) {
      var matches = this.filter( search );
    } else {
      var matches = this.where( search );
    }
    if( matches.length === 0 ) return void(0)
    return this.throughBeforeGetFilter( this[_createEntity](matches.at(0)) )
  }

  where( attr ) {
    const matches = [];
    const len = this.length;
    for( var i = 0; i < len; i++ ) {
      var match = true;
      var d = this.throughBeforeGetFilter( this[_collection][i] );
      var keys = Object.keys( attr )
      var keyLen = keys.length;
      for( var n = 0; n < keyLen; n++ ) {
        var key = keys[n];
        if( d[key] !== attr[key] ) {
          match = false; break;
        }
      }
      if( match ) matches.push( d );
    }
    return this[_createChildCollection]( matches );
  }

  filter( callback ) {
    const len = this.length;
    const matches = [];
    for( var i = 0; i < len; i++ ) {
      var item = this[_createEntity](this[_collection][i]);
      item = this.throughBeforeGetFilter( item );
      if( callback( item ) ){
        matches.push( item );
      }
    }
    return this[_createChildCollection]( matches );
  }

  at( num ) {
    var attr = this[_createEntity](this[_collection][num])
    attr = this.throughVirtualGetFilter( attr )
    attr = this.throughBeforeGetFilter( attr );
    return attr;
  }

  scope( name, callback ) {
    this.scopes[name] = callback;
    return this;
  }

  beforeSet( key, callback ) {
    this[_filters].beforeSet[key] = callback;
  }

  beforeGet( key, callback ) {
    this[_filters].beforeGet[key] = callback;
  }

  throughBeforeSetFilter( attr ) {
    const keys = Object.keys( this[_filters].beforeSet )
    for( var i = 0; i < keys.length; i++) {
      var key = keys[i];
      attr[key] = this[_filters].beforeSet[key]( attr[key] );
    }
    return attr;
  }

  throughBeforeGetFilter( attr ) {
    const keys = Object.keys( this[_filters].beforeGet )
    for( var i = 0; i < keys.length; i++) {
      var key = keys[i];
      attr[key] = this[_filters].beforeGet[key]( attr[key] );
    }
    return attr;
  }

  virtualSet( key, callback ) {
    this[_filters].virtualSet[key] = callback;
  }

  virtualGet( key, callback ) {
    this[_filters].virtualGet[key] = callback;
  }

  throughVirtualSetFilter( attr ) {
    const keys = Object.keys( this[_filters].virtualSet )
    for( var i = 0; i < keys.length; i++) {
      var key = keys[i];
      attr = this[_filters].virtualSet[key]( attr[key], attr );
      delete( attr[key] );
    }
    return attr;
  }

  throughVirtualGetFilter( attr ) {
    const keys = Object.keys( this[_filters].virtualGet )
    for( var i = 0; i < keys.length; i++) {
      var key = keys[i];
      attr[key] = this[_filters].virtualGet[key]( attr );
    }
    return attr;
  }

  with( name, ...args ) {
    return this.scopes[name]( this, ...args );
  }

  each( callback ) {
    const len = this.length;
    const clone = this.all();
    for( var i = 0; i < len; i++ ) {
      callback( clone[i], i, this)
    }
    return this;
  }

  map( callback ) {
    const result = []
    const clone = this.all()
    const len = this.length;
    for( var i = 0; i < len; i++ ) {
      result.push( callback( this.throughBeforeGetFilter( clone[i] ), i, this) )
    }
    return result
  }

  sort( order = "asc", arg ) {
    const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
    order = order.toUpperCase();
    if( order === `ASC` ) {
      clone[_collection] = _.sortBy( clone[_collection], this.throughBeforeGetFilter( arg ) )
      return clone
    } else {
      clone[_collection] = _.reverse( _.sortBy( clone[_collection], this.throughBeforeGetFilter(arg) ) )
      return clone
    }
  }

  reverse() {
    const clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
    clone[_collection] = _.reverse( clone[_collection] );
    return clone();
  }

  new( attr = {} ) {
    attr._id = this[_createID]();
    attr = Object.assign( this[_createDefaultAttributes](), attr );
    attr = this.throughVirtualSetFilter( attr );
    attr = this.throughBeforeSetFilter( attr );
    return attr;
  }

  add( attr = {} ) {
    if( this.parent !== null ) throw new Error(`Add can only root bank`)
    this.resetErrors();
    if( attr._id === void(0)) {
      attr = this.new( attr );
    } else {
      if( this[_index][attr._id] !== void(0) ) {
        throw new Error( `${attr._id} is already exists.` )
      }
    }
    if( this.validation( attr ) ) {
      for( var i = 0; i < this.uniqueKeys.length; i++ ) {
        this.addUnique( this.uniqueKeys[i], attr[this.uniqueKeys[i]], attr._id );
      }
      const data = Object.assign({},attr);
      this[_collection].push( data );
      this[_index][attr._id] = data;
      this.length++;
    }
    return !this.hasError()
  }

  save( attr ) {
    if( this.parent !== null ) throw new Error(`Save can only root bank`)
    this.resetErrors();
    if( attr._id === void(0) ) return this.add( attr );
    if( this[_index][attr._id] === void(0)) return this.add( attr );
    const newAttr = this.throughBeforeSetFilter( Object.assign( {}, this[_index][attr._id],attr ) );

    if( this.validation( newAttr, true ) ) {
      Object.assign( this[_index][attr._id], newAttr);
    }
    return !this.hasError()
  }

  remove( attr ) {
    if( this.parent !== null ) throw new Error(`Remove can only root bank`)
    const targetId = attr._id
    if( targetId === void(0) ) return false;
    if( this[_index][targetId] === void(0)) return false;


    const newUniqueVals = {}
    this.uniqueVals = {};
    for( var i = 0; i < this.uniqueKeys.length; i++ ){
      var key = this.uniqueKeys[i]
      newUniqueVals[key] = []
      for( var n = 0; n < this.length; n++ ) {
        var item = this[_collection][n]
        if( item._id !== targetId ) {
          this.addUnique( key, item[key], item._id )
        }
      }
    }
    this.uniqueVals = newUniqueVals;

    this[_index] = {};
    const newCollection = []
    for( var i = 0; i < this.length; i++ ){
      var item = this[_collection][i];
      if( item._id !== targetId ) {
        newCollection.push( item );
        this[_index][item._id] = item;
      }
    }

    this[_collection] = newCollection;
    this.length--;
    if( this.parent === null) {
      return true;
    } else {
      this.parent.remove( attr );
    }
  }

  errors() {
    if( this.parent !== null ) this.root().errors();
    return this[_errors].concat();
  }

  resetErrors() {
    if( this.parent !== null ) this.root().resetErrors();
    this[_errors] = [];
  }

  addError( attr, key, msg ) {
    if( this.parent !== null ) this.root().addError( attr,key, msg );
    this[_errors].push( new BankError( attr, key, msg ) )
    return this;
  }

  hasError() {
    return this.errors().length > 0;
  }

  addUnique( key, val, id ) {
    if( this.uniqueVals[key] === void(0) ) this.uniqueVals[key] = {};
    this.uniqueVals[key][val] = id;
    return this;
  }

  validation( attr, isUpdate = false ) {
    const schema = this.schema();
    const attrKeys = Object.keys( attr );
    const attrKeysLen = attrKeys.length;
    for( var i = 0; i < attrKeysLen; i++ ) {
      var key = attrKeys[i];
      var val = attr[key];
      if( !this.checkType(val, key)) {
        this.addError( attr, key, this.errorMessages.notPresent );
      }
      if( schema[key].require && !this.checkPresence(val) ) {
        this.addError( attr, key, this.errorMessages.notPresent );
      }
      if( schema[key].unique && !this.checkUniqueness(val, key, attr._id) ) {
        this.addError( attr, key, this.errorMessages.notUnique );
      }
    }
    return !this.hasError();
  }

  checkType( val, key ) {
    if( val === null) return true
    return typeof(val) === this.schema()[key].type;
  }

  checkPresence( val ) {
    return val !== null && val !== void(0);
  }

  checkUniqueness( val, key, id ) {
    const matchedId = this.uniqueVals[key][val]
    if( matchedId === void(0)) return true;
    if( matchedId === id ) return true;
    return false;
  }

  checkStrPresence() {
  }

  [_createDefaultAttributes]() {
    const result = {}
    const schema = this.schema()
    const schemaKeys = Object.keys( schema );
    const schemaLen = schemaKeys.length;
    for( var i = 0; i < schemaLen; i++ ) {
      var key = schemaKeys[i]
      result[key] = schema[key].default;
    }
    return result;
  }

  [_createEntity]( attr ) {
    if( attr === void(0)) return void(0);
    return Object.assign({},attr );
  }

  [_createChildCollection]( items = [] ) {
    const collection = new this.constructor()
    collection.parent = this;
    collection[_collection] = items;
    collection.length = items.length;
    return collection;
  }

  [_createID]() {
    var str = "abcdefghyjklmnopqrstuvwxyz";
    str += str.toUpperCase();
    str += "0123456789";
    var id = "";
    for( var i =0; i< 20; i++) {
      id += str[Math.floor( Math.random() * str.length )];
    }
    return `${id}`;
  }
}

class BankError {
  constructor( attr, key, msg ) {
    this.attr = attr;
    this.key = key;
    this.message = msg;
  }

  toString() {
    return this.message.replace(/__KEY__/g, this.key);
  }
}
