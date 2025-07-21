import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Typography, Space, Button, Modal, Input, message, List, Spin, Empty } from 'antd';
import {
  BookOutlined,
  EditOutlined,
  DollarOutlined,
  PlusOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './App.css';
import { Pie, Line } from '@ant-design/charts';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE = 'http://localhost:6060/api';

function App() {
  // 日记相关状态
  const [diaryList, setDiaryList] = useState<any[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [diaryContent, setDiaryContent] = useState('');
  const [diarySubmitting, setDiarySubmitting] = useState(false);
  const [editingDiary, setEditingDiary] = useState<any>(null);
  const [diaryStats, setDiaryStats] = useState<any>(null);

  // 学习笔记相关状态
  const [studyList, setStudyList] = useState<any[]>([]);
  const [studyLoading, setStudyLoading] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [studyContent, setStudyContent] = useState('');
  const [studyCategory, setStudyCategory] = useState('编程');
  const [studySubmitting, setStudySubmitting] = useState(false);
  const [editingStudy, setEditingStudy] = useState<any>(null);
  const [studyStats, setStudyStats] = useState<any[]>([]);

  // 开销相关状态
  const [expenseList, setExpenseList] = useState<any[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('餐饮');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);

  // 图表数据状态
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [expenseTrendData, setExpenseTrendData] = useState<any[]>([]);
  const [diaryTrendData, setDiaryTrendData] = useState<any[]>([]);
  const [studyTrendData, setStudyTrendData] = useState<any[]>([]);

  // 所有useState声明在App函数顶部
  const [selectedKey, setSelectedKey] = useState('diary');

  // 获取日记列表
  const fetchDiaries = async () => {
    setDiaryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/diary`, { params: { limit: 10 } });
      setDiaryList(res.data.data || []);
    } catch (err) {
      message.error('获取日记失败');
    } finally {
      setDiaryLoading(false);
    }
  };

  // 获取日记统计
  const fetchDiaryStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/diary/stats`);
      setDiaryStats(res.data.data || null);
    } catch {}
  };
  // 获取学习笔记分类统计
  const fetchStudyStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/study/stats`);
      setStudyStats(res.data.data || []);
    } catch {}
  };
  // 获取开销统计
  const fetchExpenseStats = async () => {
    try {
      const month = new Date().toISOString().slice(0,7);
      const res = await axios.get(`${API_BASE}/expense/stats`, { params: { month } });
      setExpenseStats(res.data.data || null);
    } catch {}
  };

  // 获取开销分类饼图数据
  const fetchExpenseCategoryData = async () => {
    try {
      const month = new Date().toISOString().slice(0,7);
      const res = await axios.get(`${API_BASE}/expense/stats`, { params: { month } });
      setExpenseCategoryData((res.data.data.categories || []).map((c: any) => ({ type: c.category, value: c.total })));
    } catch {}
  };
  // 获取开销月度趋势
  const fetchExpenseTrendData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expense`, { params: { limit: 1000 } });
      // 统计每月总支出
      const map: Record<string, number> = {};
      (res.data.data || []).forEach((item: any) => {
        const month = item.date.slice(0,7);
        map[month] = (map[month] || 0) + Number(item.amount);
      });
      const arr = Object.entries(map).map(([month, value]) => ({ month, value }));
      arr.sort((a, b) => a.month.localeCompare(b.month));
      setExpenseTrendData(arr.slice(-12));
    } catch {}
  };
  // 获取日记月度趋势
  const fetchDiaryTrendData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/diary`, { params: { limit: 1000 } });
      const map: Record<string, number> = {};
      (res.data.data || []).forEach((item: any) => {
        const month = item.date.slice(0,7);
        map[month] = (map[month] || 0) + 1;
      });
      const arr = Object.entries(map).map(([month, value]) => ({ month, value }));
      arr.sort((a, b) => a.month.localeCompare(b.month));
      setDiaryTrendData(arr.slice(-12));
    } catch {}
  };
  // 获取学习笔记月度趋势
  const fetchStudyTrendData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/study`, { params: { limit: 1000 } });
      const map: Record<string, number> = {};
      (res.data.data || []).forEach((item: any) => {
        const month = item.date.slice(0,7);
        map[month] = (map[month] || 0) + 1;
      });
      const arr = Object.entries(map).map(([month, value]) => ({ month, value }));
      arr.sort((a, b) => a.month.localeCompare(b.month));
      setStudyTrendData(arr.slice(-12));
    } catch {}
  };

  useEffect(() => {
    if (selectedKey === 'diary') {
      fetchDiaries();
      fetchDiaryStats();
      fetchDiaryTrendData();
    }
    if (selectedKey === 'study') {
      fetchStudies();
      fetchStudyStats();
      fetchStudyTrendData();
    }
    if (selectedKey === 'expense') {
      fetchExpenses();
      fetchExpenseStats();
      fetchExpenseCategoryData();
      fetchExpenseTrendData();
    }
    // eslint-disable-next-line
  }, [selectedKey]);

  // 编辑日记
  const openEditDiary = (item: any) => {
    setEditingDiary(item);
    setDiaryContent(item.content);
    setShowDiaryModal(true);
  };

  // 提交日记（新增或编辑）
  const handleDiarySubmit = async () => {
    if (!diaryContent.trim()) {
      message.warning('日记内容不能为空');
      return;
    }
    setDiarySubmitting(true);
    try {
      if (editingDiary) {
        await axios.put(`${API_BASE}/diary/${editingDiary.id}`, { content: diaryContent, date: editingDiary.date });
        message.success('日记已更新');
      } else {
        await axios.post(`${API_BASE}/diary`, { content: diaryContent });
        message.success('日记添加成功');
      }
      setShowDiaryModal(false);
      setDiaryContent('');
      setEditingDiary(null);
      fetchDiaries();
    } catch (err) {
      message.error('操作失败');
    } finally {
      setDiarySubmitting(false);
    }
  };

  // 删除日记
  const handleDeleteDiary = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/diary/${id}`);
      message.success('已删除');
      fetchDiaries();
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 获取学习笔记列表
  const fetchStudies = async () => {
    setStudyLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/study`, { params: { limit: 10 } });
      setStudyList(res.data.data || []);
    } catch (err) {
      message.error('获取学习笔记失败');
    } finally {
      setStudyLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKey === 'study') {
      fetchStudies();
    }
    // eslint-disable-next-line
  }, [selectedKey]);

  // 编辑学习笔记
  const openEditStudy = (item: any) => {
    setEditingStudy(item);
    setStudyContent(item.content);
    setStudyCategory(item.category || '编程');
    setShowStudyModal(true);
  };

  // 提交学习笔记（新增或编辑）
  const handleStudySubmit = async () => {
    if (!studyContent.trim()) {
      message.warning('笔记内容不能为空');
      return;
    }
    setStudySubmitting(true);
    try {
      if (editingStudy) {
        await axios.put(`${API_BASE}/study/${editingStudy.id}`, { content: studyContent, category: studyCategory, date: editingStudy.date });
        message.success('学习笔记已更新');
      } else {
        await axios.post(`${API_BASE}/study`, { content: studyContent, category: studyCategory });
        message.success('学习笔记添加成功');
      }
      setShowStudyModal(false);
      setStudyContent('');
      setStudyCategory('编程');
      setEditingStudy(null);
      fetchStudies();
    } catch (err) {
      message.error('操作失败');
    } finally {
      setStudySubmitting(false);
    }
  };

  // 删除学习笔记
  const handleDeleteStudy = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/study/${id}`);
      message.success('已删除');
      fetchStudies();
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 获取开销记录列表
  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/expense`, { params: { limit: 10 } });
      setExpenseList(res.data.data || []);
    } catch (err) {
      message.error('获取开销记录失败');
    } finally {
      setExpenseLoading(false);
    }
  };

  useEffect(() => {
    if (selectedKey === 'expense') {
      fetchExpenses();
    }
    // eslint-disable-next-line
  }, [selectedKey]);

  // 提交新开销或编辑
  const handleExpenseSubmit = async () => {
    if (!expenseAmount.trim() || isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
      message.warning('请输入有效的金额');
      return;
    }
    setExpenseSubmitting(true);
    try {
      if (editingExpense) {
        // 编辑
        await axios.put(`${API_BASE}/expense/${editingExpense.id}`, {
          category: expenseCategory,
          amount: expenseAmount,
          note: expenseNote,
          date: editingExpense.date
        });
        message.success('开销记录已更新');
      } else {
        // 新增
        await axios.post(`${API_BASE}/expense`, {
          category: expenseCategory,
          amount: expenseAmount,
          note: expenseNote
        });
        message.success('开销记录已添加');
      }
      setShowExpenseModal(false);
      setExpenseCategory('餐饮');
      setExpenseAmount('');
      setExpenseNote('');
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      message.error('操作失败');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // 删除开销
  const handleDeleteExpense = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/expense/${id}`);
      message.success('已删除');
      fetchExpenses();
    } catch (err) {
      message.error('删除失败');
    }
  };

  // 打开编辑弹窗
  const openEditExpense = (item: any) => {
    setEditingExpense(item);
    setExpenseCategory(item.category || '餐饮');
    setExpenseAmount(item.amount + '');
    setExpenseNote(item.note || '');
    setShowExpenseModal(true);
  };

  const menuItems = [
    {
      key: 'diary',
      icon: <EditOutlined />,
      label: '日常生活记录',
    },
    {
      key: 'study',
      icon: <BookOutlined />,
      label: '学习总结',
    },
    {
      key: 'expense',
      icon: <DollarOutlined />,
      label: '每日开销',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'diary':
        return (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>
                      <EditOutlined style={{ marginRight: 8 }} />
                      今日日记
                    </Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowDiaryModal(true)}>
                      写日记
                    </Button>
                  </div>
                  <Text type="secondary">记录今天的心情、事件和感悟...</Text>
                </Space>
              </Card>

              {/* 日记列表 */}
              <Card title={<span><CalendarOutlined /> 最近日记</span>}>
                {diaryLoading ? (
                  <Spin />
                ) : (
                  <List
                    dataSource={diaryList}
                    locale={{ emptyText: <Empty description="暂无日记" /> }}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <a key="edit" onClick={() => openEditDiary(item)}>编辑</a>,
                          <a key="delete" onClick={() => handleDeleteDiary(item.id)}>删除</a>
                        ]}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{item.date}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.created_at?.slice(0, 16).replace('T', ' ')}</Text>
                          </div>
                          <div style={{ marginTop: 4 }}>{item.content}</div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* 日记卡片 */}
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <Text strong>本月日记</Text>
                      <Text type="secondary">{diaryStats ? diaryStats.total_days : '-'}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <EditOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <Text strong>连续记录</Text>
                      <Text type="secondary">-</Text> {/* 连续天数可后续实现 */}
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <BarChartOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <Text strong>总字数</Text>
                      <Text type="secondary">{diaryStats ? diaryStats.total_chars : '-'}</Text>
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* 日记月度趋势图 */}
              <Card title="近12个月日记数量趋势" style={{ marginTop: 24 }}>
                <Line
                  data={diaryTrendData}
                  xField="month"
                  yField="value"
                  point={{ size: 4 }}
                  smooth
                  xAxis={{ tickCount: 12 }}
                />
              </Card>
            </Space>

            {/* 写日记弹窗 */}
            <Modal
              title={editingDiary ? "编辑日记" : "写日记"}
              open={showDiaryModal}
              onOk={handleDiarySubmit}
              onCancel={() => { setShowDiaryModal(false); setEditingDiary(null); setDiaryContent(''); }}
              okText="提交"
              confirmLoading={diarySubmitting}
            >
              <TextArea
                rows={6}
                value={diaryContent}
                onChange={e => setDiaryContent(e.target.value)}
                placeholder="请输入今天的日记内容..."
                maxLength={1000}
                showCount
              />
            </Modal>
          </div>
        );
      
      case 'study':
        return (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>
                      <BookOutlined style={{ marginRight: 8 }} />
                      学习笔记
                    </Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowStudyModal(true)}>
                      添加笔记
                    </Button>
                  </div>
                  <Text type="secondary">整理学习心得、知识点和计划...</Text>
                </Space>
              </Card>

              {/* 学习笔记列表 */}
              <Card title={<span><BookOutlined /> 最新学习笔记</span>}>
                {studyLoading ? (
                  <Spin />
                ) : (
                  <List
                    dataSource={studyList}
                    locale={{ emptyText: <Empty description="暂无学习笔记" /> }}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <a key="edit" onClick={() => openEditStudy(item)}>编辑</a>,
                          <a key="delete" onClick={() => handleDeleteStudy(item.id)}>删除</a>
                        ]}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{item.category || '未分类'}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                          </div>
                          <div style={{ marginTop: 4 }}>{item.content}</div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* 学习笔记卡片 */}
              <Row gutter={[16, 16]}>
                {['编程','英语','设计','其他'].map(cat => {
                  const stat = studyStats.find(s => s.category === cat);
                  return (
                    <Col span={6} key={cat}>
                      <Card>
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                          <BookOutlined style={{ fontSize: 24, color: cat==='编程'?'#1890ff':cat==='英语'?'#52c41a':cat==='设计'?'#faad14':'#f5222d' }} />
                          <Text strong>{cat}</Text>
                          <Text type="secondary">{stat ? stat.count : 0} 篇笔记</Text>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* 学习笔记月度趋势图 */}
              <Card title="近12个月学习笔记数量趋势" style={{ marginTop: 24 }}>
                <Line
                  data={studyTrendData}
                  xField="month"
                  yField="value"
                  point={{ size: 4 }}
                  smooth
                  xAxis={{ tickCount: 12 }}
                />
              </Card>
            </Space>

            {/* 添加学习笔记弹窗 */}
            <Modal
              title={editingStudy ? "编辑学习笔记" : "添加学习笔记"}
              open={showStudyModal}
              onOk={handleStudySubmit}
              onCancel={() => { setShowStudyModal(false); setEditingStudy(null); setStudyContent(''); setStudyCategory('编程'); }}
              okText="提交"
              confirmLoading={studySubmitting}
            >
              <div style={{ marginBottom: 12 }}>
                <Text>分类：</Text>
                <select value={studyCategory} onChange={e => setStudyCategory(e.target.value)} style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}>
                  <option value="编程">编程</option>
                  <option value="英语">英语</option>
                  <option value="设计">设计</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <TextArea
                rows={6}
                value={studyContent}
                onChange={e => setStudyContent(e.target.value)}
                placeholder="请输入学习笔记内容..."
                maxLength={1000}
                showCount
              />
            </Modal>
          </div>
        );
      
      case 'expense':
        return (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>
                      <DollarOutlined style={{ marginRight: 8 }} />
                      开销记录
                    </Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      setEditingExpense(null);
                      setExpenseCategory('餐饮');
                      setExpenseAmount('');
                      setExpenseNote('');
                      setShowExpenseModal(true);
                    }}>
                      记一笔
                    </Button>
                  </div>
                  <Text type="secondary">记录每日消费，掌握支出情况...</Text>
                </Space>
              </Card>

              {/* 开销记录列表 */}
              <Card title={<span><DollarOutlined /> 最新开销记录</span>}>
                {expenseLoading ? (
                  <Spin />
                ) : (
                  <List
                    dataSource={expenseList}
                    locale={{ emptyText: <Empty description="暂无开销记录" /> }}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <a key="edit" onClick={() => openEditExpense(item)}>编辑</a>,
                          <a key="delete" onClick={() => handleDeleteExpense(item.id)}>删除</a>
                        ]}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{item.category || '未分类'}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Text type="danger">¥{item.amount}</Text>
                            {item.note && <span style={{ marginLeft: 8, color: '#888' }}>({item.note})</span>}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* 开销卡片 */}
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <DollarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <Text strong>本月支出</Text>
                      <Text type="secondary">¥{expenseStats ? (expenseStats.total_amount || 0) : '-'}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <Text strong>今日支出</Text>
                      <Text type="secondary">-</Text> {/* 可后续实现 */}
                    </Space>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <DollarOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <Text strong>平均每日</Text>
                      <Text type="secondary">¥{expenseStats ? (expenseStats.avg_amount ? expenseStats.avg_amount.toFixed(2) : 0) : '-'}</Text>
                    </Space>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <DollarOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                      <Text strong>预算剩余</Text>
                      <Text type="secondary">-</Text> {/* 可后续实现 */}
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* 本月各类消费占比饼图 */}
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <Card title="本月各类消费占比">
                    <Pie
                      data={expenseCategoryData}
                      angleField="value"
                      colorField="type"
                      radius={0.9}
                      label={{
                        content: (data: any) => `${data.type} ${(data.percent * 100).toFixed(1)}%`
                      }}
                      legend={{ position: 'bottom' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="近12个月总支出趋势">
                    <Line
                      data={expenseTrendData}
                      xField="month"
                      yField="value"
                      point={{ size: 4 }}
                      smooth
                      xAxis={{ tickCount: 12 }}
                    />
                  </Card>
                </Col>
              </Row>
            </Space>

            {/* 记一笔/编辑开销弹窗 */}
            <Modal
              title={editingExpense ? '编辑开销' : '记一笔'}
              open={showExpenseModal}
              onOk={handleExpenseSubmit}
              onCancel={() => setShowExpenseModal(false)}
              okText="提交"
              confirmLoading={expenseSubmitting}
            >
              <div style={{ marginBottom: 12 }}>
                <Text>分类：</Text>
                <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}>
                  <option value="餐饮">餐饮</option>
                  <option value="交通">交通</option>
                  <option value="娱乐">娱乐</option>
                  <option value="购物">购物</option>
                  <option value="医疗">医疗</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text>金额：</Text>
                <Input
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="请输入金额"
                  min={0}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text>备注：</Text>
                <Input
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  placeholder="可填写备注"
                  maxLength={50}
                />
              </div>
            </Modal>
          </div>
        );
      
      default:
        return <div>请选择功能模块</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          MyWeb 个人生活记录
        </Title>
      </Header>
      
      <Layout>
        <Sider width={250} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#f5f5f5', 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            borderRadius: 8
          }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
