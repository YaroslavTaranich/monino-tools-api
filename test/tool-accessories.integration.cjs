// Run only against a disposable, empty local database. See DEPLOYMENT.md.
const assert = require('node:assert/strict');
const { Sequelize } = require('sequelize-typescript');
const { QueryTypes } = require('sequelize');
const { Tool } = require('../dist/tool/tool.model');
const { ToolType } = require('../dist/tool-type/tool-type.model');
const { Category } = require('../dist/category/category.model');
const { ToolService } = require('../dist/tool/tool.service');
const { migrations } = require('../dist/database/migrations');

const db = new Sequelize('monino_accessories_test', 'postgres', 'accessories-test-only', {
  dialect: 'postgres', host: '127.0.0.1', port: 55439, logging: false,
  models: [Tool, ToolType, Category],
});
const service = new ToolService(Tool, ToolType, {});
const dto = (name, accessory_only = false, related_tool_ids) => ({
  name, label: name, title: name, description: 'Test description', specification: 'Test: value',
  html_title: 'Test title', html_description: 'Test description',
  price: 150, zalog: 1000, tool_type_id: 1, accessory_only,
  ...(related_tool_ids === undefined ? {} : {related_tool_ids}),
});
const ids = async (id) => (await service.getOneToolById(id)).get('related_tool_ids');

async function main() {
  const tables = await db.getQueryInterface().showAllTables();
  assert.equal(tables.length, 0, 'Integration test requires an empty disposable database');
  for (const migration of migrations) {
    await db.transaction(transaction => migration.up({sequelize: db, transaction}));
    if (migration.name === '001-initial-schema') {
      await db.query(`INSERT INTO "user" (id, name, role, password) VALUES (43, 'admin-test', 'admin', 'unused')`);
      // Existing rows must survive all migrations and default to standalone rental.
      await db.query(`INSERT INTO tools (name,label,title,description,specification,html_title,html_description,price,zalog,tool_type)
        VALUES ('legacy','legacy','legacy','legacy','legacy','legacy','legacy',1000,1000,'legacy')`);
    }
  }
  assert.equal((await Tool.findOne({where: {name: 'legacy'}})).accessory_only, false);
  const pump = await service.createTool(dto('pump-main'));
  const generator = await service.createTool(dto('generator-main'));
  const hose = await service.createTool(dto('hose-addon', true, [pump.id]));
  const cable = await service.createTool(dto('cable-addon', true, [generator.id]));
  assert.deepEqual(await ids(pump.id), [hose.id]);
  assert.deepEqual(await ids(hose.id), [pump.id]);
  assert.deepEqual(await ids(generator.id), [cable.id]);
  assert.deepEqual(await ids(cable.id), [generator.id]);
  assert.equal(hose.price, 150);
  assert.equal(hose.get('related_tools')[0].related_tools, undefined, 'No recursive payload');

  await service.updateToolById(pump.id, dto('pump-main', false, [cable.id, hose.id]));
  assert.deepEqual(await ids(pump.id), [cable.id, hose.id]);
  await service.updateToolById(cable.id, dto('cable-addon', true, [pump.id, generator.id]));
  assert.deepEqual(await ids(cable.id), [pump.id, generator.id]);
  assert.deepEqual(await ids(pump.id), [cable.id, hose.id], 'Reverse edit preserves this side ordering');
  assert.deepEqual(await ids(hose.id), [pump.id], 'No transitive links to cable');

  await service.updateToolById(pump.id, dto('pump-main'));
  assert.deepEqual(await ids(pump.id), [cable.id, hose.id], 'Older client omitting ids preserves links');
  for (const invalid of [[pump.id], [999999], [hose.id, hose.id], [generator.id]]) {
    await assert.rejects(service.updateToolById(pump.id, dto('pump-main', false, invalid)));
    assert.deepEqual(await ids(pump.id), [cable.id, hose.id]);
  }
  await assert.rejects(service.updateToolById(pump.id, dto('changed-role', true)));
  const unchanged = await Tool.findByPk(pump.id);
  assert.equal(unchanged.name, 'pump-main', 'Invalid role change rolls all fields back');
  assert.equal(unchanged.accessory_only, false);
  const count = await Tool.count();
  await assert.rejects(service.createTool(dto('invalid-create', true, [999999])));
  assert.equal(await Tool.count(), count, 'Failed create leaves no partial tool');

  await assert.rejects(db.query(`INSERT INTO tool_accessories(tool_id, accessory_tool_id) VALUES (:id, :id)`, {
    replacements: {id: pump.id},
  }));
  await assert.rejects(db.query(`INSERT INTO tool_accessories(tool_id, accessory_tool_id) VALUES (:left, :right)`, {
    replacements: {left: hose.id, right: pump.id},
  }));
  await assert.rejects(db.query(`INSERT INTO tool_accessories(tool_id, accessory_tool_id) VALUES (:left, :right)`, {
    replacements: {left: pump.id, right: hose.id},
  }));
  await assert.rejects(db.query(`INSERT INTO tool_accessories(tool_id, accessory_tool_id) VALUES (999998, 999999)`));

  await service.updateToolById(hose.id, dto('hose-addon', true, []));
  assert.deepEqual(await ids(hose.id), []);
  assert.deepEqual(await ids(pump.id), [cable.id], 'Removal is symmetric');
  await service.deleteToolById(cable.id);
  assert.deepEqual(await ids(pump.id), []);
  assert.deepEqual(await ids(generator.id), []);
  const links = await db.query('SELECT * FROM tool_accessories', {type: QueryTypes.SELECT});
  assert.equal(links.length, 0, 'Deleting a tool cascades links');
  const all = await service.getAllTools();
  assert.ok(all.every(tool => Array.isArray(tool.get('related_tools'))));
  console.log('PASS: migrations, legacy defaults, symmetric links, independent sorting, non-transitivity, validation, atomic rollback, SQL constraints, cascade deletion, compact API payload');
}
main().then(() => db.close()).catch(async error => {
  console.error(error);
  await db.close();
  process.exitCode = 1;
});
