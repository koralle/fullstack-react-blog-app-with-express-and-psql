const express = require('express');
const router = express.Router();
const pool = require('./db');

/* POSTS ROUTES SECTION */

// DBから全てのpostsをdata_createdが新しい順番に取得する。
router.get('/api/get/allposts', (req, res, next) => {
  pool.query(
    `SELECT * FROM posts ORDER BY date_created DESC`,
    (q_err, q_res) => {
      res.json(q_res.rows);
    });
});


router.get('/api/get/post', (req, res, next) => {
  pool.query(
    `SELECT * FROM posts WHERE pid=$1`,
    [post_id], (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

// DBにuser定義のpostを保存する。
router.get('/api/post/posttodb', (req, res, next) => {
  const values = [
    req.body.title,
    req.body.body,
    req.body.uid,
    req.body.username
  ];
  pool.query(
    `INSERT INTO posts(title, body, user_id, author, date_created) VALUES($1, $2, $3, $4, NOW() )`,
    values, (q_err, q_res) => {
      if (q_err) return next(q_err);
      res.json(q_res.rows);
    });
});

// DBに既に保存されているpostを編集する。
router.put('/api/put/post', (req, res, next) => {
  const values = [
    req.body.title,
    req.body.body,
    req.body.uid,
    req.body.username
  ];
  pool.query(
    `UPDATE posts SET title = $1, body=$2, user_id = $3, author = $5, date_created = NOW() WHERE pid = $4`,
    values, (q_err, q_res) => {
      console.log(q_res);
      console.log(q_err);
    });
});

// あるpostに関連付けられたcommentsをすべて削除する。
router.delete('/api/delete/postcomments', (req, res, next) => {
  const post_id = req.body.post_id
  pool.query(
    `DELETE FROM comments WHERE post_id = $1`, [post_id],
    (q_err, q_res) => {
      res.json(q_res.rows)
      console.log(q_err)
    });
});

// あるpost idのpostを削除する。
router.delete('/api/delete/post', (req, res, next) => {
  const post_id = req.body.post_id;
  pool.query(`DELETE FROM posts WHERE pid = $1`, [post_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    });
});

// likeしてくれたuserを配列に突っ込む & likesのカウントを+1する。
router.put('/api/put/likes', (req, res, next) => {
  const uid = [req.body.uid];
  const post_id = String(req.body.post_id);

  const values = [uid, post_id];
  console.log(values);
  pool.query(
    `UPDATE posts SET like_user_id = like_user_id || $1, likes = likes + 1 WHERE NOT (like_user_id @> $1) AND pid = ($2)`,
    values, (q_err, q_res) => {
      if (q_err) return next(q_err);
      console.log(q_res);
      res.json(q_res.rows);
    });
});

/*
  COMMENTS ROUTES SECTION
*/

// DBにコメントを保存する。
router.post('/api/post/commenttodb', (req, res, next) => {
  const values = [
    req.body.comment,
    req.body.user_id,
    req.body.username,
    req.body.post_id
  ];

  pool.query(
    `INSERT INTO comments(comment, user_id, author, post_id, date_created) VALUES($1, $2, $3, $4, NOW())`,
    values,
    (q_err, q_res) => {
      res.json(q_res.rows);
      console.log(q_err);
    });
});

// DBに既に保存されているコメントを編集する。
router.put('/api/put/commenttodb', (req, res, next) => {
  const cid = req.body.comment_id;
  console.log(cid);
  pool.query(
    `DELETE FROM comments WHERE cid=$1`, [cid],
    (q_err, q_res) => {
      res.json(q_res);
      console.log(q_err);
    });
});

// ある単一のコメントを削除する。
router.delete('/api/delete/comment', (req, res, next) => {
  const cid = req.body.comment_id;
  console.log(cid);
  pool.query(
    `DELETE FROM comments WHERE cid=$1`, [cid],
    (q_err, q_res) => {
      res.json(q_res);
      console.log(q_err);
    });
});

// ある単一のpostに関連付けられたcommentをすべて取得する。
router.get('/api/get/allpostcomments', (req, res, next) => {
  const post_id = String(req.query.post_id);
  pool.query(`SELECT * FROM comments
              WHERE post_id=$1`, [post_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

/*
  USER PROFILE SECTION
*/

// auth0からのuser profile dataをDBに保存する。
router.post('/api/posts/userprofiletodb', (req, res, next) => {
  const values = [req.body.profile.nickname,
  req.body.profile.email,
  req.body.profile.email_verified];
  pool.query(`INSERT INTO users(username, email, email_verified, date_created)
              VALUES($1, $2, $3, NOW())
              ON CONFLICT DO NOTHING`, values,
    (q_err, q_res) => {
      res.json(q_res.rows);
    })
})

// emailを元にuserを探す。
router.get('/api/get/userprofilefromdb', (req, res, next) => {
  const email = req.query.email;
  console.log(email);
  pool.query(`SELECT * FROM users
              WHERE email=$1`, [email],
    (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

// 検索対象のuser idにマッチするuserのpostを取得する(1つだけではない)。
router.get('/api/get/userposts', (req, res, next) => {
  const user_id = req.query.user_id;
  console.log(user_id);
  pool.query(`SELECT * FROM posts WHERE user_id=$1`, [user_id],
    (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

// Retrieve another users profile from db based on username
router.get('/api/get/otheruserprofilefromdb', (req, res, next) => {
  // const email = [ "%" + req.query.email + "%"]
  const username = String(req.query.username);
  pool.query(`SELECT * FROM users
              WHERE username = $1`,
    [username], (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

//Get another user's posts based on username
router.get('/api/get/otheruserposts', (req, res, next) => {
  const username = String(req.query.username);
  pool.query(`SELECT * FROM posts
              WHERE author = $1`,
    [username], (q_err, q_res) => {
      res.json(q_res.rows);
    });
});

module.exports = router;