console.log('=== 当前运行的 server.js 路径是：', __filename);
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 6060;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
const dbPath = path.resolve(__dirname, 'myweb.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
  }
});

// 创建表（如不存在）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS study (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS expense (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT,
    amount REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// 工具函数：获取当前日期
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// 工具函数：数据库查询Promise化
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'MyWeb API 服务已启动', status: 'success' });
});

// ==================== 日记相关API ====================

// 获取日记统计
app.get('/api/diary/stats', async (req, res) => {
  try {
    console.log('stats route called');
    const stats = await dbQuery(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT date) as total_days,
        SUM(LENGTH(content)) as total_chars
      FROM diary
    `);
    console.log('diary stats result:', stats);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('diary stats error:', error);
    console.trace();
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// 获取所有日记
app.get('/api/diary', async (req, res) => {
  try {
    const { page = 1, limit = 10, date } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM diary';
    let params = [];
    
    if (date) {
      sql += ' WHERE date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const diaries = await dbQuery(sql, params);
    res.json({ success: true, data: diaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单篇日记
app.get('/api/diary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const diaries = await dbQuery('SELECT * FROM diary WHERE id = ?', [id]);
    
    if (diaries.length === 0) {
      return res.status(404).json({ success: false, error: '日记不存在' });
    }
    
    res.json({ success: true, data: diaries[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建日记
app.post('/api/diary', async (req, res) => {
  try {
    const { date = getCurrentDate(), content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '日记内容不能为空' });
    }
    
    const result = await dbRun(
      'INSERT INTO diary (date, content) VALUES (?, ?)',
      [date, content.trim()]
    );
    
    const newDiary = await dbQuery('SELECT * FROM diary WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newDiary[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新日记
app.put('/api/diary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '日记内容不能为空' });
    }
    
    const result = await dbRun(
      'UPDATE diary SET date = ?, content = ? WHERE id = ?',
      [date || getCurrentDate(), content.trim(), id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '日记不存在' });
    }
    
    const updatedDiary = await dbQuery('SELECT * FROM diary WHERE id = ?', [id]);
    res.json({ success: true, data: updatedDiary[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除日记
app.delete('/api/diary/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM diary WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '日记不存在' });
    }
    
    res.json({ success: true, message: '日记删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 学习笔记相关API ====================

// 获取学习笔记分类统计
app.get('/api/study/stats', async (req, res) => {
  try {
    const stats = await dbQuery(`
      SELECT 
        category,
        COUNT(*) as count
      FROM study
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('study stats result:', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('study stats error:', error);
    console.trace();
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// 获取所有学习笔记
app.get('/api/study', async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM study';
    let params = [];
    
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const studies = await dbQuery(sql, params);
    res.json({ success: true, data: studies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单篇学习笔记
app.get('/api/study/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studies = await dbQuery('SELECT * FROM study WHERE id = ?', [id]);
    
    if (studies.length === 0) {
      return res.status(404).json({ success: false, error: '学习笔记不存在' });
    }
    
    res.json({ success: true, data: studies[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建学习笔记
app.post('/api/study', async (req, res) => {
  try {
    const { date = getCurrentDate(), category, content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '学习笔记内容不能为空' });
    }
    
    const result = await dbRun(
      'INSERT INTO study (date, category, content) VALUES (?, ?, ?)',
      [date, category || '其他', content.trim()]
    );
    
    const newStudy = await dbQuery('SELECT * FROM study WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newStudy[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新学习笔记
app.put('/api/study/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '学习笔记内容不能为空' });
    }
    
    const result = await dbRun(
      'UPDATE study SET date = ?, category = ?, content = ? WHERE id = ?',
      [date || getCurrentDate(), category || '其他', content.trim(), id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '学习笔记不存在' });
    }
    
    const updatedStudy = await dbQuery('SELECT * FROM study WHERE id = ?', [id]);
    res.json({ success: true, data: updatedStudy[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除学习笔记
app.delete('/api/study/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM study WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '学习笔记不存在' });
    }
    
    res.json({ success: true, message: '学习笔记删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 开销记录相关API ====================

// 获取开销统计
app.get('/api/expense/stats', async (req, res) => {
  try {
    const { month } = req.query;
    let dateCondition = '';
    let params = [];
    if (month) {
      dateCondition = 'WHERE strftime("%Y-%m", date) = ?';
      params.push(month);
    }
    const stats = await dbQuery(`
      SELECT 
        SUM(amount) as total_amount,
        COUNT(*) as total_count,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM expense
      ${dateCondition}
    `, params);
    // 获取分类统计
    const categoryStats = await dbQuery(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expense
      ${dateCondition}
      GROUP BY category
      ORDER BY total DESC
    `, params);
    console.log('expense stats result:', stats);
    console.log('expense categoryStats result:', categoryStats);
    res.json({ 
      success: true, 
      data: {
        ...stats[0],
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('expense stats error:', error);
    console.trace();
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// 获取所有开销记录
app.get('/api/expense', async (req, res) => {
  try {
    const { page = 1, limit = 10, date, category } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM expense';
    let params = [];
    let conditions = [];
    
    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const expenses = await dbQuery(sql, params);
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单条开销记录
app.get('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expenses = await dbQuery('SELECT * FROM expense WHERE id = ?', [id]);
    
    if (expenses.length === 0) {
      return res.status(404).json({ success: false, error: '开销记录不存在' });
    }
    
    res.json({ success: true, data: expenses[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建开销记录
app.post('/api/expense', async (req, res) => {
  try {
    const { date = getCurrentDate(), category, amount, note } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: '金额必须大于0' });
    }
    
    const result = await dbRun(
      'INSERT INTO expense (date, category, amount, note) VALUES (?, ?, ?, ?)',
      [date, category || '其他', parseFloat(amount), note || '']
    );
    
    const newExpense = await dbQuery('SELECT * FROM expense WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newExpense[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新开销记录
app.put('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, amount, note } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: '金额必须大于0' });
    }
    
    const result = await dbRun(
      'UPDATE expense SET date = ?, category = ?, amount = ?, note = ? WHERE id = ?',
      [date || getCurrentDate(), category || '其他', parseFloat(amount), note || '', id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '开销记录不存在' });
    }
    
    const updatedExpense = await dbQuery('SELECT * FROM expense WHERE id = ?', [id]);
    res.json({ success: true, data: updatedExpense[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除开销记录
app.delete('/api/expense/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM expense WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '开销记录不存在' });
    }
    
    res.json({ success: true, message: '开销记录删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`后端服务已启动：http://localhost:${PORT}`);
  console.log('API文档：');
  console.log('日记相关：GET/POST/PUT/DELETE /api/diary');
  console.log('学习笔记：GET/POST/PUT/DELETE /api/study');
  console.log('开销记录：GET/POST/PUT/DELETE /api/expense');
}); 